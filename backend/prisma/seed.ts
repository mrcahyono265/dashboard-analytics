import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seed script refuses to run in production (NODE_ENV=production)');
    process.exit(1);
  }
  console.log('🌱 Seeding initial development data...');

  const password = await bcrypt.hash('admin123', 10);
  const adam = await prisma.user.upsert({
    where: { username: 'adam.bakhtiar.muqsith' },
    update: {},
    create: {
      username: 'adam.bakhtiar.muqsith',
      passwordHash: password,
      displayName: 'Adam Bakhtiar Muqsith',
      role: 'RSE',
    }
  });
  console.log('✅ Development admin ready:', adam.displayName);

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
    await prisma.target.upsert({
      where: {
        channel_period_center_staffName: {
          channel: t.channel,
          period: currentPeriod,
          center: '',
          staffName: '',
        },
      },
      update: {},
      create: { ...t, period: currentPeriod },
    });
  }
  console.log('✅ Default targets ready for period:', currentPeriod);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
