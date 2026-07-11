import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create RSE (Om Mbak Zahra)
  const rsePassword = await bcrypt.hash('admin123', 10);
  const rse = await prisma.user.upsert({
    where: { username: 'zahra' },
    update: {},
    create: {
      username: 'zahra',
      passwordHash: rsePassword,
      displayName: 'Mbak Zahra (RSE)',
      role: 'RSE',
      region: 'East'
    }
  });
  console.log('✅ Created RSE:', rse.displayName);

  // Create Store Managers
  const smPassword = await bcrypt.hash('sm123', 10);
  const storeManagers = [
    { username: 'febriana', displayName: 'Febriana Juwita Sari', center: 'XLC Madiun' },
    { username: 'sofia', displayName: 'Sofia SM', center: 'XLC Pamekasan' },
    { username: 'andi', displayName: 'Andi SM', center: 'XLC Surabaya' }
  ];

  for (const sm of storeManagers) {
    const user = await prisma.user.upsert({
      where: { username: sm.username },
      update: {},
      create: {
        ...sm,
        passwordHash: smPassword,
        role: 'STORE_MANAGER'
      }
    });
    console.log('✅ Created Store Manager:', user.displayName);
  }

  // Create CRRs
  const crrPassword = await bcrypt.hash('crr123', 10);
  const crrs = [
    { username: 'dyah', displayName: 'Dyah Ayu Maharani', center: 'XLC Madiun', crrName: 'Dyah Ayu Maharani' },
    { username: 'sofi', displayName: 'Sofi Mufaridah', center: 'XLC Madiun', crrName: 'Sofi Mufaridah' },
    { username: 'yono', displayName: 'Yono TI 97', center: 'XLC Madiun', crrName: 'Yono TI 97' },
    { username: 'okti', displayName: 'Oky Septian', center: 'XLC Pamekasan', crrName: 'Oky Septian' }
  ];

  for (const crr of crrs) {
    const user = await prisma.user.upsert({
      where: { username: crr.username },
      update: {},
      create: {
        ...crr,
        passwordHash: crrPassword,
        role: 'CRR'
      }
    });
    console.log('✅ Created CRR:', user.displayName);
  }

  // Create default targets
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const targets = [
    { channel: 'XLC', targetValue: 500, center: '' },
    { channel: 'GSF', targetValue: 300000000, center: '' },
    { channel: 'Merchant', targetValue: 50, center: '' },
    { channel: 'WO', targetValue: 100, center: '' },
    { channel: 'EXPO', targetValue: 200, center: '' },
    { channel: 'XLSatu', targetValue: 20, center: '' }
  ];

  for (const target of targets) {
    await prisma.target.upsert({
      where: {
        channel_period_center: {
          channel: target.channel,
          period: currentPeriod,
          center: target.center
        }
      },
      update: { targetValue: target.targetValue },
      create: {
        ...target,
        period: currentPeriod
      }
    });
  }
  console.log('✅ Created default targets for period:', currentPeriod);

  console.log('🎉 Seeding completed!');
  console.log('\n📋 Login credentials:');
  console.log('┌─────────────────────────────────────────────────────┐');
  console.log('│ Role          │ Username    │ Password              │');
  console.log('├─────────────────────────────────────────────────────┤');
  console.log('│ RSE           │ zahra       │ admin123              │');
  console.log('│ Store Manager │ febriana    │ sm123                 │');
  console.log('│ Store Manager │ sofia       │ sm123                 │');
  console.log('│ Store Manager │ andi        │ sm123                 │');
  console.log('│ CRR           │ dyah        │ crr123                │');
  console.log('│ CRR           │ sofi        │ crr123                │');
  console.log('│ CRR           │ yono        │ crr123                │');
  console.log('│ CRR           │ okti        │ crr123                │');
  console.log('└─────────────────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
