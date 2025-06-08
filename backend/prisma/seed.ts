import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  // 创建管理员账号
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@charging.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@charging.com',
      password: hashedPassword,
      role: 'ADMIN',
      phoneNumber: '13800138000'
    }
  });

  console.log('管理员账号已创建:', admin);

  // 初始化充电桩数据（如果需要）
  const pilesCount = await prisma.chargingPile.count();
  if (pilesCount === 0) {
    await prisma.chargingPile.createMany({
      data: [
        { name: 'A', type: 'FAST', power: 30, position: 1 },
        { name: 'B', type: 'FAST', power: 30, position: 2 },
        { name: 'C', type: 'SLOW', power: 7, position: 3 },
        { name: 'D', type: 'SLOW', power: 7, position: 4 },
        { name: 'E', type: 'SLOW', power: 7, position: 5 }
      ]
    });
    console.log('充电桩数据已初始化');
  }

  console.log('数据初始化完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });