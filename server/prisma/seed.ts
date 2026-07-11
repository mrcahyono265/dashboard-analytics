import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      displayName: 'Administrator',
      role: 'ADMIN'
    }
  });
  console.log('✅ Created admin user:', admin.username);

  // Create sample manager
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { username: 'manager1' },
    update: {},
    create: {
      username: 'manager1',
      passwordHash: managerPassword,
      displayName: 'Manager Utama',
      role: 'MANAGER',
      rsm: 'East'
    }
  });
  console.log('✅ Created manager user:', manager.username);

  // Create sample sales users
  const salesPassword = await bcrypt.hash('sales123', 10);
  const salesUsers = [
    { username: 'sales1', displayName: 'Sales Madiun', rsm: 'East', sm: 'Madiun', storeName: 'XLC Madiun' },
    { username: 'sales2', displayName: 'Sales Pamekasan', rsm: 'East', sm: 'Pamekasan', storeName: 'XLC Pamekasan' },
    { username: 'sales3', displayName: 'Sales Surabaya', rsm: 'East', sm: 'Surabaya', storeName: 'XLC Surabaya' }
  ];

  for (const sales of salesUsers) {
    const user = await prisma.user.upsert({
      where: { username: sales.username },
      update: {},
      create: {
        ...sales,
        passwordHash: salesPassword,
        role: 'SALES'
      }
    });
    console.log('✅ Created sales user:', user.username);
  }

  // Create default targets
  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
  const targets = [
    { channel: 'XLC', targetValue: 500 },
    { channel: 'GSF', targetValue: 300000000 },
    { channel: 'Merchant', targetValue: 50 },
    { channel: 'WO', targetValue: 100 },
    { channel: 'EXPO', targetValue: 200 },
    { channel: 'XLSatu', targetValue: 20 }
  ];

  for (const target of targets) {
    await prisma.target.upsert({
      where: {
        channel_period: {
          channel: target.channel,
          period: currentPeriod
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
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
