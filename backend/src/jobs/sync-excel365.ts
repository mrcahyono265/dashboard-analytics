import * as XLSX from 'xlsx';
import { prisma } from '../lib/db.js';
import { MicrosoftGraphClient } from '../lib/excel365.js';
import { getTokens } from '../lib/token-store.js';
import { detectReportFile, parseReport } from '../lib/parser-report.js';
import { parseWorkbook } from '../lib/parsers.js';
import { notifyDataUpdated } from '../lib/sse.js';

interface SyncJob {
  id: string;
  fileId: string;
  timer?: ReturnType<typeof setInterval>;
}

const activeJobs = new Map<string, SyncJob>();
const POLL_INTERVAL_MS = 60_000;

// Clear user-owned data when switching sources. Scoped to ONE user — never touches global tables.
export async function clearAllUserData(userId: string): Promise<void> {
  stopSyncJob(userId);
  stopUrlSyncJob(userId);

  await prisma.$transaction([
    // Only this user's data records
    prisma.dataRecord.deleteMany({ where: { uploadedBy: userId } }),
    // Only this user's sync logs
    prisma.syncLog.deleteMany({ where: { source: { in: ['excel365', 'url'] } } }),
    // Reset user flags
    prisma.user.update({
      where: { id: userId },
      data: { autoSyncEnabled: false, syncConfig: null, stagingJson: null },
    }),
  ]);
}

// Core: parse a workbook buffer and upsert into DB. Reused by URL, upload, OneDrive paths.
export async function syncFromBuffer(
  userId: string,
  buffer: Buffer | Uint8Array,
  source: 'upload' | 'excel365' | 'url',
  period?: string
): Promise<{ recordsCount: number; sheets: { sheetType: string; count: number }[] }> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const p = period || new Date().toISOString().slice(0, 7);
  const sheets: { sheetType: string; count: number }[] = [];

  const save = async (sheetType: string, data: any[], category: string) => {
    if (!data || data.length === 0) return;
    await prisma.dataRecord.upsert({
      where: { sheetType_period_uploadedBy_category: { sheetType, period: p, uploadedBy: userId, category } },
      update: { dataJson: JSON.stringify(data), source },
      create: { sheetType, period: p, category, dataJson: JSON.stringify(data), uploadedBy: userId, source },
    });
    sheets.push({ sheetType, count: data.length });
  };

  if (detectReportFile(workbook)) {
    const report = parseReport(workbook);
    await save('XLC_REPORT', report.xlcReport, 'report');
    await save('GSF_REPORT', report.gsfReport, 'report');
    await save('WO_REPORT', report.woReport, 'report');
    await save('EXPO_REPORT', report.expoReport, 'report');
    await save('STORE_MASTER', report.storeMaster, 'report');
    await save('RANKING', report.ranking, 'report');
  } else {
    const parsedData = parseWorkbook(buffer);
    for (const [sheetType, data] of Object.entries(parsedData)) {
      await save(sheetType, data as any[], 'entry');
    }
  }

  const total = sheets.reduce((s, x) => s + x.count, 0);
  return { recordsCount: total, sheets };
}

// Generate an Excel workbook from DB data (two-way: DB → Excel download)
export async function generateExcelBuffer(userId: string): Promise<Buffer> {
  const records = await prisma.dataRecord.findMany({
    where: { uploadedBy: userId },
    orderBy: { sheetType: 'asc' },
  });

  const wb = XLSX.utils.book_new();

  for (const record of records) {
    const data = JSON.parse(record.dataJson);
    if (!Array.isArray(data) || data.length === 0) continue;
    const ws = XLSX.utils.json_to_sheet(data);
    // ponytail: Excel sheet names max 31 chars, sanitize
    const name = record.sheetType.slice(0, 31).replace(/[\\/?*[\]:]/g, '_');
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

// OneDrive-specific sync (download via Graph API then parse)
export async function syncOnce(
  userId: string,
  fileId: string,
  accessToken: string,
  period?: string
): Promise<{ recordsCount: number; sheets: { sheetType: string; count: number }[] }> {
  const client = new MicrosoftGraphClient(accessToken);
  const buf = await client.downloadFile(fileId);
  const result = await syncFromBuffer(userId, buf, 'excel365', period);

  await prisma.syncLog.create({
    data: { source: 'excel365', fileId, status: 'success', recordsCount: result.recordsCount },
  });

  return result;
}

async function runSync(job: SyncJob): Promise<void> {
  try {
    const tokens = await getTokens(job.id);
    if (!tokens) throw new Error('No tokens — reconnect Microsoft 365');
    const result = await syncOnce(job.id, job.fileId, tokens.accessToken);
    console.log(`[Sync] Auto-sync completed for user ${job.id}: ${result.recordsCount} records`);
    notifyDataUpdated(job.id);
  } catch (error) {
    console.error(`[Sync] Auto-sync failed for user ${job.id}:`, error);
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

export async function startSyncJob(
  userId: string,
  fileId: string,
): Promise<void> {
  stopSyncJob(userId);
  const job: SyncJob = { id: userId, fileId };
  await runSync(job);
  job.timer = setInterval(() => runSync(job), POLL_INTERVAL_MS);
  activeJobs.set(userId, job);
  console.log(`[Sync] Started auto-sync for user ${userId}, file ${fileId}`);
}

export function stopSyncJob(userId: string): void {
  const job = activeJobs.get(userId);
  if (job?.timer) clearInterval(job.timer);
  activeJobs.delete(userId);
}

export function getSyncJobStatus(userId: string): { active: boolean; fileId?: string } {
  const job = activeJobs.get(userId);
  return { active: !!job, fileId: job?.fileId };
}

// ─── URL Auto-Sync (polls a URL on interval) ───────────────────────────────

interface UrlSyncJob {
  id: string;
  url: string;
  timer?: ReturnType<typeof setInterval>;
}

const urlJobs = new Map<string, UrlSyncJob>();

async function runUrlSync(userId: string, url: string): Promise<void> {
  try {
    const resp = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DashboardSync/1.0)' },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) throw new Error('Not a valid xlsx file');

    await clearAllUserData(userId);
    const result = await syncFromBuffer(userId, buf, 'url');
    console.log(`[Sync] URL auto-sync for ${userId}: ${result.recordsCount} records`);
    notifyDataUpdated(userId);
  } catch (error) {
    console.error(`[Sync] URL auto-sync failed for ${userId}:`, error);
  }
}

export async function startUrlSyncJob(userId: string, url: string): Promise<void> {
  stopUrlSyncJob(userId);
  await runUrlSync(userId, url);
  const job: UrlSyncJob = { id: userId, url, timer: setInterval(() => runUrlSync(userId, url), POLL_INTERVAL_MS) };
  urlJobs.set(userId, job);
  console.log(`[Sync] Started URL auto-sync for user ${userId}`);
}

export function stopUrlSyncJob(userId: string): void {
  const job = urlJobs.get(userId);
  if (job?.timer) clearInterval(job.timer);
  urlJobs.delete(userId);
}

export function getUrlSyncJobStatus(userId: string): { active: boolean; url?: string } {
  const job = urlJobs.get(userId);
  return { active: !!job, url: job?.url };
}

// Resume all auto-sync jobs from DB on server startup
export async function resumeAllSyncJobs(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { autoSyncEnabled: true, syncConfig: { not: null } },
    select: { id: true, syncConfig: true },
  });
  for (const user of users) {
    if (!user.syncConfig) continue;
    try {
      const config = JSON.parse(user.syncConfig);
      if (config.type === 'onedrive' && config.fileId) {
        console.log(`[Sync] Resuming OneDrive auto-sync for user ${user.id}`);
        await startSyncJob(user.id, config.fileId);
      } else if (config.type === 'url' && config.url) {
        console.log(`[Sync] Resuming URL auto-sync for user ${user.id}`);
        await startUrlSyncJob(user.id, config.url);
      }
    } catch (err) {
      console.error(`[Sync] Failed to resume sync for user ${user.id}:`, err);
    }
  }
}
