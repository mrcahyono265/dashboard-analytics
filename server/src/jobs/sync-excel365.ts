import { prisma } from '../lib/db.js';
import { MicrosoftGraphClient } from '../lib/excel365.js';
import * as XLSX from 'xlsx';

interface SyncJob {
  id: string;
  fileId: string;
  accessToken: string;
  intervalMs: number;
  timer?: ReturnType<typeof setInterval>;
}

const activeJobs = new Map<string, SyncJob>();

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export async function startSyncJob(
  userId: string,
  fileId: string,
  accessToken: string,
  intervalMs: number = POLL_INTERVAL_MS
): Promise<void> {
  // Stop existing job for this user
  stopSyncJob(userId);

  const job: SyncJob = {
    id: userId,
    fileId,
    accessToken,
    intervalMs,
  };

  // Run immediately
  await runSync(job);

  // Schedule periodic sync
  job.timer = setInterval(async () => {
    await runSync(job);
  }, intervalMs);

  activeJobs.set(userId, job);
  console.log(`[Sync] Started sync job for user ${userId}, file ${fileId}`);
}

export function stopSyncJob(userId: string): void {
  const job = activeJobs.get(userId);
  if (job?.timer) {
    clearInterval(job.timer);
  }
  activeJobs.delete(userId);
  console.log(`[Sync] Stopped sync job for user ${userId}`);
}

export function getSyncJobStatus(userId: string): { active: boolean; fileId?: string } {
  const job = activeJobs.get(userId);
  return {
    active: !!job,
    fileId: job?.fileId,
  };
}

async function runSync(job: SyncJob): Promise<void> {
  try {
    const client = new MicrosoftGraphClient(job.accessToken);

    // Get file metadata for change detection
    const metadata = await client.getFileMetadata(job.fileId);

    // Check if file has changed (compare with last sync)
    const lastSync = await prisma.syncLog.findFirst({
      where: {
        source: 'excel365',
        fileId: job.fileId,
        status: 'success',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastSync && lastSync.createdAt.toISOString() >= metadata.lastModified) {
      // No changes detected
      return;
    }

    // Fetch and parse Excel data
    const workbook = await client.getWorkbook(job.fileId);
    const allData: Record<string, any[]> = {};

    for (const worksheet of workbook.worksheets) {
      try {
        const values = await client.getAllSheetData(job.fileId, worksheet.name);
        if (values.length > 0) {
          // Convert array of arrays to array of objects
          const headers = values[0];
          const data = values.slice(1).map(row => {
            const obj: Record<string, any> = {};
            headers.forEach((header: string, i: number) => {
              if (header) obj[header] = row[i];
            });
            return obj;
          });
          allData[worksheet.name] = data;
        }
      } catch (error) {
        console.warn(`[Sync] Failed to read worksheet ${worksheet.name}:`, error);
      }
    }

    // Map sheet names to our sheet types
    const sheetMapping: Record<string, string> = {
      'XLC&GSF': 'XLC',
      'WO': 'WO',
      'EXPO': 'EXPO',
      'Sheet1': 'XLSatu',
      'Sheet2': 'Promotor',
    };

    // Store parsed data
    let recordsCount = 0;
    const period = new Date().toISOString().slice(0, 7);

    for (const [sheetName, data] of Object.entries(allData)) {
      const sheetType = sheetMapping[sheetName] || sheetName;
      const validTypes = ['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu', 'ELITE', 'Promotor'];

      if (validTypes.includes(sheetType) && data.length > 0) {
        await prisma.dataRecord.upsert({
          where: {
            sheetType_period_uploadedBy: {
              sheetType,
              period,
              uploadedBy: job.id,
            },
          },
          update: {
            dataJson: JSON.stringify(data),
            source: 'excel365',
          },
          create: {
            sheetType,
            period,
            dataJson: JSON.stringify(data),
            uploadedBy: job.id,
            source: 'excel365',
          },
        });
        recordsCount += data.length;
      }
    }

    // Log successful sync
    await prisma.syncLog.create({
      data: {
        source: 'excel365',
        fileId: job.fileId,
        status: 'success',
        recordsCount,
      },
    });

    console.log(`[Sync] Sync completed for user ${job.id}: ${recordsCount} records`);
  } catch (error) {
    console.error(`[Sync] Sync failed for user ${job.id}:`, error);

    // Log failed sync
    await prisma.syncLog.create({
      data: {
        source: 'excel365',
        fileId: job.fileId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
