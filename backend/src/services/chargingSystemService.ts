import { PrismaClient } from '@prisma/client';
import { virtualTimeService } from './virtualTimeService';
import { SocketService } from './socketService';

export class ChargingSystemService {
  private prisma: PrismaClient;
  private isProcessing: boolean = false;
  private socketService: SocketService;
  private static instance: ChargingSystemService;

  constructor(socketService: SocketService) {
    this.prisma = new PrismaClient();
    this.socketService = socketService;
  }

  // 初始化充电系统
  public async initialize() {
    console.log('正在初始化充电调度系统...');
    
    // 初始化充电桩数据
    await this.initializeChargingPiles();
    
    // 初始化系统配置
    await this.initializeSystemConfig();
    
    // 启动调度服务
    this.startSchedulingService();
    
    console.log('充电调度系统初始化完成');
  }

  // 初始化充电桩数据
  private async initializeChargingPiles() {
    const existingPiles = await this.prisma.chargingPile.count();
    
    if (existingPiles === 0) {
      // 创建充电桩A、B（快充）、C、D、E（慢充）
      await this.prisma.chargingPile.createMany({
        data: [
          { name: 'A', type: 'FAST', power: 30, position: 1, status: 'NORMAL' },
          { name: 'B', type: 'FAST', power: 30, position: 2, status: 'NORMAL' },
          { name: 'C', type: 'SLOW', power: 7, position: 3, status: 'NORMAL' },
          { name: 'D', type: 'SLOW', power: 7, position: 4, status: 'NORMAL' },
          { name: 'E', type: 'SLOW', power: 7, position: 5, status: 'NORMAL' }
        ]
      });
      
      console.log('充电桩数据初始化完成');
    }
  }

  // 初始化系统配置
  private async initializeSystemConfig() {
    const configs = [
      { key: 'charging_fee_fast', value: '1.2' }, // 快充费率(元/度)
      { key: 'charging_fee_slow', value: '0.8' }, // 慢充费率(元/度)
      { key: 'service_fee_fast', value: '0.8' }, // 快充服务费(元/度)
      { key: 'service_fee_slow', value: '0.4' }, // 慢充服务费(元/度)
      { key: 'max_waiting_time', value: '120' }, // 最大等待时间(分钟)
      { key: 'auto_charging_start', value: 'true' } // 是否自动开始充电
    ];

    for (const config of configs) {
      await this.prisma.systemConfig.upsert({
        where: { key: config.key },
        update: {},
        create: config
      });
    }

    console.log('系统配置初始化完成');
  }

  // 启动调度服务
  private startSchedulingService() {
    // 定时检查排队情况和调度
    setInterval(() => {
      this.processQueue();
    }, 5000); // 每5秒检查一次

    // 定时更新充电状态
    setInterval(() => {
      this.updateChargingStatus();
    }, 10000); // 每10秒更新一次充电状态
  }

  // 处理排队调度
  private async processQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // 获取等待中的排队记录
      const waitingRecords = await this.prisma.queueRecord.findMany({
        where: {
          status: 'WAITING'
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (waitingRecords.length === 0) {
        return; // 没有等待中的记录
      }

      // 获取所有可用的充电桩
      const availablePiles = await this.prisma.chargingPile.findMany({
        where: {
          status: 'NORMAL',
          queueRecords: {
            none: {
              status: 'CHARGING'
            }
          }
        }
      });

      if (availablePiles.length === 0) {
        return; // 没有可用充电桩
      }

      // 按类型分组可用充电桩
      const fastPiles = availablePiles.filter(pile => pile.type === 'FAST');
      const slowPiles = availablePiles.filter(pile => pile.type === 'SLOW');

      // 为每个等待中的记录尝试分配充电桩
      for (const record of waitingRecords) {
        const matchingPiles = record.chargingMode === 'FAST' ? fastPiles : slowPiles;
        
        if (matchingPiles.length > 0) {
          const pile = matchingPiles.shift(); // 取出并移除第一个充电桩
          try {
            await this.startCharging(record.id, pile!.id);
            console.log(`成功分配充电桩 - 排队号: ${record.queueNumber}, 充电桩: ${pile!.name}`);
          } catch (error) {
            console.error(`分配充电桩失败 - 排队号: ${record.queueNumber}:`, error);
            // 如果分配失败，将充电桩放回可用列表
            matchingPiles.push(pile!);
          }
        }
      }

    } catch (error) {
      console.error('处理排队调度错误:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // 开始充电
  public async startCharging(queueRecordId: string, chargingPileId: string) {
    const queueRecord = await this.prisma.queueRecord.findUnique({
      where: { id: queueRecordId },
      include: {
        user: true
      }
    });

    if (!queueRecord) {
      throw new Error('排队记录不存在');
    }

    // 生成充电详单编号
    const recordNumber = await this.generateRecordNumber();
    
    // 基于虚拟时间获取电价
    const currentTime = virtualTimeService.getCurrentTime();
    const electricityPrice = virtualTimeService.getElectricityPrice(currentTime);
    const serviceFeeRate = 0.8; // 统一服务费率

    // 计算费用
    const chargingFee = queueRecord.requestedAmount * electricityPrice;
    const serviceFee = queueRecord.requestedAmount * serviceFeeRate;
    const totalFee = chargingFee + serviceFee;

    console.log(`充电开始 - 时间: ${currentTime.toLocaleString('zh-CN')}, 时段: ${virtualTimeService.getTimeSegment(currentTime)}, 电价: ${electricityPrice}元/度`);

    // 事务处理：更新排队记录状态并创建充电记录
    const chargingRecord = await this.prisma.$transaction(async (tx) => {
      // 更新排队记录状态
      await tx.queueRecord.update({
        where: { id: queueRecordId },
        data: {
          chargingPileId,
          status: 'CHARGING'
        }
      });

      // 创建充电记录
      return await tx.chargingRecord.create({
        data: {
          recordNumber,
          userId: queueRecord.userId,
          chargingPileId,
          requestedAmount: queueRecord.requestedAmount,
          actualAmount: 0, // 开始时为0，充电完成后更新
          chargingTime: 0,
          startTime: currentTime,
          chargingFee,
          serviceFee,
          totalFee,
          status: 'CHARGING'
        }
      });
    });

    // 通知用户充电开始
    this.socketService.notifyUser(queueRecord.userId, {
      type: 'charging_start',
      data: {
        recordNumber: chargingRecord.recordNumber,
        chargingPile: chargingPileId,
        requestedAmount: queueRecord.requestedAmount,
        message: '充电已开始'
      }
    });

    console.log(`成功开始充电 - 排队号: ${queueRecord.queueNumber}, 充电桩: ${chargingPileId}, 详单号: ${chargingRecord.recordNumber}`);

    return chargingRecord;
  }

  // 更新充电状态（模拟充电过程）
  private async updateChargingStatus() {
    try {
      // 获取正在充电的记录
      const chargingRecords = await this.prisma.chargingRecord.findMany({
        where: { status: 'CHARGING' },
        include: {
          chargingPile: true,
          user: true
        }
      });

      for (const record of chargingRecords) {
        // 计算充电时长（分钟）- 使用虚拟时间
        const currentTime = virtualTimeService.getCurrentTime();
        const chargingTimeMinutes = Math.floor(
          (currentTime.getTime() - record.startTime.getTime()) / (1000 * 60)
        );

        // 根据充电桩功率计算实际充电量
        const powerKWH = record.chargingPile.power;
        const actualAmount = Math.min(
          (chargingTimeMinutes / 60) * powerKWH,
          record.requestedAmount
        );

        // 获取当前时段的电价
        const electricityPrice = virtualTimeService.getElectricityPrice(currentTime);
        const serviceFeeRate = record.chargingPile.type === 'FAST' ? 0.5 : 0.3;
        
        // 计算费用
        const chargingFee = actualAmount * electricityPrice;
        const serviceFee = actualAmount * serviceFeeRate;
        const totalFee = chargingFee + serviceFee;

        // 更新充电记录
        await this.prisma.chargingRecord.update({
          where: { id: record.id },
          data: {
            actualAmount,
            chargingTime: chargingTimeMinutes / 60,
            chargingFee,
            serviceFee,
            totalFee
          }
        });

        // 检查是否充电完成
        if (actualAmount >= record.requestedAmount) {
          await this.completeCharging(record.id);
        }

        console.log(`充电进度更新 - 详单号: ${record.recordNumber}, 实际充电量: ${actualAmount.toFixed(2)}度, 进度: ${Math.floor((actualAmount / record.requestedAmount) * 100)}%`);
      }
    } catch (error) {
      console.error('更新充电状态错误:', error);
    }
  }

  // 完成充电
  private async completeCharging(recordId: string) {
    try {
      const record = await this.prisma.chargingRecord.findUnique({
        where: { id: recordId },
        include: {
          user: true,
          chargingPile: true
        }
      });

      if (!record) return;

      // 使用虚拟时间
      const currentTime = virtualTimeService.getCurrentTime();
      
      // 获取当前时段的电价
      const electricityPrice = virtualTimeService.getElectricityPrice(currentTime);
      const serviceFeeRate = record.chargingPile.type === 'FAST' ? 0.5 : 0.3;

      // 重新计算实际费用
      const actualChargingFee = record.actualAmount * electricityPrice;
      const actualServiceFee = record.actualAmount * serviceFeeRate;
      const actualTotalFee = actualChargingFee + actualServiceFee;

      // 事务处理：完成充电并释放充电桩
      await this.prisma.$transaction(async (tx) => {
        // 更新充电记录为已完成
        await tx.chargingRecord.update({
          where: { id: recordId },
          data: {
            endTime: currentTime,
            chargingFee: actualChargingFee,
            serviceFee: actualServiceFee,
            totalFee: actualTotalFee,
            status: 'COMPLETED'
          }
        });

        // 更新对应的排队记录为已完成
        await tx.queueRecord.updateMany({
          where: {
            userId: record.userId,
            chargingPileId: record.chargingPileId,
            status: 'CHARGING'
          },
          data: {
            status: 'COMPLETED'
          }
        });
      });

      console.log(`充电完成 - 详单号: ${record.recordNumber}, 充电桩: ${record.chargingPile.name}`);
    } catch (error) {
      console.error('完成充电错误:', error);
    }
  }

  // 生成充电详单编号 - 使用虚拟时间
  private async generateRecordNumber(): Promise<string> {
    const today = virtualTimeService.getCurrentTime().toISOString().split('T')[0].replace(/-/g, '');
    const count = await this.prisma.chargingRecord.count({
      where: {
        recordNumber: {
          startsWith: `CR${today}`
        }
      }
    });
    
    return `CR${today}${(count + 1).toString().padStart(4, '0')}`;
  }

  // 获取系统配置
  private async getSystemConfig(key: string): Promise<string | null> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key }
    });
    return config?.value || null;
  }

  // 手动分配充电桩（供管理员使用）
  public async manualAssignPile(queueRecordId: string, chargingPileId: string) {
    try {
      // 检查充电桩是否可用
      const pile = await this.prisma.chargingPile.findUnique({
        where: { id: chargingPileId }
      });

      if (!pile || pile.status !== 'NORMAL') {
        throw new Error('充电桩不可用');
      }

      // 检查充电桩是否已被占用
      const existingAssignment = await this.prisma.queueRecord.findFirst({
        where: {
          chargingPileId,
          status: {
            in: ['IN_QUEUE', 'CHARGING']
          }
        }
      });

      if (existingAssignment) {
        throw new Error('充电桩已被占用');
      }

      // 开始充电
      await this.startCharging(queueRecordId, chargingPileId);
      
      return { success: true, message: '充电桩分配成功' };
    } catch (error) {
      console.error('手动分配充电桩错误:', error);
      throw error;
    }
  }

  // 紧急停止充电
  public async emergencyStopCharging(recordId: string, reason: string = '紧急停止') {
    try {
      await this.prisma.$transaction(async (tx) => {
        // 更新充电记录 - 使用虚拟时间
        await tx.chargingRecord.update({
          where: { id: recordId },
          data: {
            endTime: virtualTimeService.getCurrentTime(),
            status: 'FAULT'
          }
        });

        // 更新排队记录
        const chargingRecord = await tx.chargingRecord.findUnique({
          where: { id: recordId }
        });

        if (chargingRecord) {
          await tx.queueRecord.updateMany({
            where: {
              userId: chargingRecord.userId,
              status: 'CHARGING'
            },
            data: {
              status: 'CANCELLED'
            }
          });
        }
      });

      console.log(`紧急停止充电 - 记录ID: ${recordId}, 原因: ${reason}`);
      return { success: true, message: '充电已紧急停止' };
    } catch (error) {
      console.error('紧急停止充电错误:', error);
      throw error;
    }
  }
} 