import { PrismaClient, ChargingStatus, QueueStatus, ChargingPileType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestData() {
  console.log('开始创建测试数据...');

  // 创建测试用户
  const hashedPassword = await bcrypt.hash('user123', 12);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@user.com' },
    update: {},
    create: {
      username: 'testuser',
      email: 'test@user.com',
      password: hashedPassword,
      role: 'USER',
      phoneNumber: '13900139000'
    }
  });

  console.log('测试用户已创建:', testUser);

  // 确保充电桩存在
  const chargingPiles = await prisma.chargingPile.findMany();
  console.log('现有充电桩:', chargingPiles);

  if (chargingPiles.length > 0) {
    // 创建一些测试的充电记录
    const testRecords = [
      {
        recordNumber: 'CR202501011001',
        userId: testUser.id,
        chargingPileId: chargingPiles[0].id,
        requestedAmount: 30.0,
        actualAmount: 30.0,
        chargingTime: 1.0,
        startTime: new Date('2025-06-10T08:00:00Z'),
        endTime: new Date('2025-06-10T09:00:00Z'),
        chargingFee: 30.0,
        serviceFee: 15.0,
        totalFee: 45.0,
        status: ChargingStatus.COMPLETED
      },
      {
        recordNumber: 'CR202501011002',
        userId: testUser.id,
        chargingPileId: chargingPiles[1].id,
        requestedAmount: 20.0,
        actualAmount: 18.5,
        chargingTime: 0.8,
        startTime: new Date('2025-06-10T10:00:00Z'),
        endTime: new Date('2025-06-10T10:48:00Z'),
        chargingFee: 18.5,
        serviceFee: 9.25,
        totalFee: 27.75,
        status: ChargingStatus.COMPLETED
      }
    ];

    for (const record of testRecords) {
      await prisma.chargingRecord.upsert({
        where: { recordNumber: record.recordNumber },
        update: {},
        create: record
      });
    }

    // 创建一些排队记录
    const queueRecords = [
      {
        queueNumber: 'F1',
        userId: testUser.id,
        chargingPileId: chargingPiles[0].id,
        batteryCapacity: 50.0,
        requestedAmount: 25.0,
        chargingMode: ChargingPileType.FAST,
        position: 1,
        status: QueueStatus.WAITING
      },
      {
        queueNumber: 'T1',
        userId: testUser.id,
        batteryCapacity: 40.0,
        requestedAmount: 15.0,
        chargingMode: ChargingPileType.SLOW,
        position: 1,
        status: QueueStatus.IN_QUEUE
      }
    ];

    for (const queue of queueRecords) {
      await prisma.queueRecord.upsert({
        where: { queueNumber: queue.queueNumber },
        update: {},
        create: queue
      });
    }

    console.log('测试数据创建完成！');
  } else {
    console.log('没有找到充电桩，请先运行seed文件');
  }
}

createTestData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 