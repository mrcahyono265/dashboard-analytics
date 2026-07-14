import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seed script refuses to run in production (NODE_ENV=production)');
    process.exit(1);
  }
  console.log('🌱 Resetting database (dev only)...');

  await prisma.syncLog.deleteMany();
  await prisma.dataRecord.deleteMany();
  await prisma.target.deleteMany();
  await prisma.userAssignment.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ All existing data cleared');

  const password = await bcrypt.hash('admin123', 10);
  const adam = await prisma.user.create({
    data: {
      username: 'adam.bakhtiar.muqsith',
      passwordHash: password,
      displayName: 'Adam Bakhtiar Muqsith',
      role: 'RSE',
    }
  });
  console.log('✅ Created admin:', adam.displayName);

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const targets = [
    { channel: 'XLC', targetValue: 500 },
    { channel: 'GSF', targetValue: 300000000 },
    { channel: 'Merchant', targetValue: 50 },
    { channel: 'WO', targetValue: 100 },
    { channel: 'EXPO', targetValue: 200 },
    { channel: 'XLSatu', targetValue: 20 },
  ];
  for (const t of targets) {
    await prisma.target.create({ data: { ...t, period: currentPeriod } });
  }
  console.log('✅ Created default targets for period:', currentPeriod);

  console.log('\n📋 Login: adam.bakhtiar.muqsith / admin123');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
