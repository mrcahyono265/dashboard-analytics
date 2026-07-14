import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();
const PERIOD = '2026-07';

async function main() {
  const filePath = path.resolve(process.cwd(), '..', 'data', 'Achivement XLC dan GSF Juli 2026.xlsx');
  const wb = XLSX.readFile(filePath);

  let count = 0;

  // ─── XLC&GSF sheet — CRR targets ───────────────────────────
  // Structure: [Store, Store Manager, CRR, day1..day31, Instore, Merchant, Achievement, Target, ...]
  const xlcRows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets['XLC&GSF'], { header: 1 });
  const xlcHeaders = xlcRows[1] as any[];
  const xlcTargetIdx = xlcHeaders.findIndex((h: any) => h === 'Target');

  const xlcSeen = new Set<string>();
  for (let i = 2; i < xlcRows.length; i++) {
    const row = xlcRows[i] as any[];
    if (!row || !row[0] || !row[2]) continue;
    const store = String(row[0]).trim();
    const crr = String(row[2]).trim();
    const target = xlcTargetIdx >= 0 ? Number(row[xlcTargetIdx]) : 0;
    if (!target || target <= 0 || xlcSeen.has(crr)) continue;
    xlcSeen.add(crr);

    await prisma.target.upsert({
      where: { channel_period_center_staffName: { channel: 'XLC', period: PERIOD, center: store, staffName: crr } },
      update: { targetValue: target },
      create: { channel: 'XLC', period: PERIOD, center: store, staffName: crr, targetValue: target },
    });
    count++;
    console.log(`✅ XLC: ${store} / ${crr} = ${target}`);
  }

  // ─── WO sheet — Agent WO targets ───────────────────────────
  // Structure: [Store, Store Manager, Agent WO, day1..day31, Prio, Merchant, Achievement, Target, ...]
  const woRows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets['WO'], { header: 1 });
  const woHeaders = woRows[1] as any[];
  const woTargetIdx = woHeaders.findIndex((h: any) => h === 'Target');

  const woSeen = new Set<string>();
  for (let i = 2; i < woRows.length; i++) {
    const row = woRows[i] as any[];
    if (!row || !row[0] || !row[2]) continue;
    const store = String(row[0]).trim();
    const agent = String(row[2]).trim();
    const target = woTargetIdx >= 0 ? Number(row[woTargetIdx]) : 0;
    if (!target || target <= 0 || woSeen.has(agent)) continue;
    woSeen.add(agent);

    await prisma.target.upsert({
      where: { channel_period_center_staffName: { channel: 'WO', period: PERIOD, center: store, staffName: agent } },
      update: { targetValue: target },
      create: { channel: 'WO', period: PERIOD, center: store, staffName: agent, targetValue: target },
    });
    count++;
    console.log(`✅ WO: ${store} / ${agent} = ${target}`);
  }

  // ─── EXPO sheet — Promotor targets ─────────────────────────
  // Structure: [Store, Promotor, day1..day31, Achievement, Target, ...]
  // Note: No Store Manager column — Promotor is at index 1
  const expoRows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets['EXPO'], { header: 1 });
  const expoHeaders = expoRows[1] as any[];
  const expoTargetIdx = expoHeaders.findIndex((h: any) => h === 'Target');

  const expoSeen = new Set<string>();
  for (let i = 2; i < expoRows.length; i++) {
    const row = expoRows[i] as any[];
    if (!row || !row[0] || !row[1]) continue;
    const store = String(row[0]).trim();
    const promotor = String(row[1]).trim();
    const target = expoTargetIdx >= 0 ? Number(row[expoTargetIdx]) : 0;
    if (!target || target <= 0 || expoSeen.has(promotor)) continue;
    expoSeen.add(promotor);

    await prisma.target.upsert({
      where: { channel_period_center_staffName: { channel: 'EXPO', period: PERIOD, center: store, staffName: promotor } },
      update: { targetValue: target },
      create: { channel: 'EXPO', period: PERIOD, center: store, staffName: promotor, targetValue: target },
    });
    count++;
    console.log(`✅ EXPO: ${store} / ${promotor} = ${target}`);
  }

  console.log(`\n🎉 Seeded ${count} targets for period ${PERIOD}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() });
