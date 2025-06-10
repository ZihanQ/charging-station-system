"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChargingSystemService = void 0;
const client_1 = require("@prisma/client");
class ChargingSystemService {
    constructor(socketService) {
        this.isProcessing = false;
        this.prisma = new client_1.PrismaClient();
        this.socketService = socketService;
    }
    // 初始化充电系统
    async initialize() {
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
    async initializeChargingPiles() {
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
    async initializeSystemConfig() {
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
    startSchedulingService() {
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
    async processQueue() {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        try {
            // 获取可用的充电桩
            const availablePiles = await this.prisma.chargingPile.findMany({
                where: {
                    status: 'NORMAL',
                    queueRecords: {
                        none: {
                            status: {
                                in: ['IN_QUEUE', 'CHARGING']
                            }
                        }
                    }
                },
                orderBy: { position: 'asc' }
            });
            if (availablePiles.length === 0) {
                return; // 没有可用充电桩
            }
            // 按类型分组可用充电桩
            const fastPiles = availablePiles.filter(pile => pile.type === 'FAST');
            const slowPiles = availablePiles.filter(pile => pile.type === 'SLOW');
            // 处理快充队列
            if (fastPiles.length > 0) {
                await this.assignPilesToQueue('FAST', fastPiles);
            }
            // 处理慢充队列
            if (slowPiles.length > 0) {
                await this.assignPilesToQueue('SLOW', slowPiles);
            }
        }
        catch (error) {
            console.error('处理排队调度错误:', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    // 为队列分配充电桩
    async assignPilesToQueue(chargingMode, availablePiles) {
        // 获取等待中的排队记录
        const waitingRecords = await this.prisma.queueRecord.findMany({
            where: {
                chargingMode,
                status: 'WAITING'
            },
            include: {
                user: true
            },
            orderBy: { createdAt: 'asc' },
            take: availablePiles.length
        });
        for (let i = 0; i < waitingRecords.length && i < availablePiles.length; i++) {
            const record = waitingRecords[i];
            const pile = availablePiles[i];
            try {
                // 分配充电桩并开始充电
                await this.startCharging(record.id, pile.id);
                // 通知用户
                this.socketService.notifyUser(record.userId, {
                    type: 'charging_assigned',
                    data: {
                        queueNumber: record.queueNumber,
                        chargingPile: pile.name,
                        message: `您的充电请求已分配到${pile.name}桩，请前往充电`
                    }
                });
                console.log(`已为排队号${record.queueNumber}分配充电桩${pile.name}`);
            }
            catch (error) {
                console.error(`分配充电桩失败 - 排队号${record.queueNumber}:`, error);
            }
        }
    }
    // 开始充电
    async startCharging(queueRecordId, chargingPileId) {
        const queueRecord = await this.prisma.queueRecord.findUnique({
            where: { id: queueRecordId }
        });
        if (!queueRecord) {
            throw new Error('排队记录不存在');
        }
        // 生成充电详单编号
        const recordNumber = await this.generateRecordNumber();
        // 获取费率配置
        const chargingFeeRate = parseFloat((await this.getSystemConfig(queueRecord.chargingMode === 'FAST' ? 'charging_fee_fast' : 'charging_fee_slow')) || '1.0');
        const serviceFeeRate = parseFloat((await this.getSystemConfig(queueRecord.chargingMode === 'FAST' ? 'service_fee_fast' : 'service_fee_slow')) || '0.5');
        // 计算费用
        const chargingFee = queueRecord.requestedAmount * chargingFeeRate;
        const serviceFee = queueRecord.requestedAmount * serviceFeeRate;
        const totalFee = chargingFee + serviceFee;
        // 事务处理：更新排队记录状态并创建充电记录
        await this.prisma.$transaction(async (tx) => {
            // 更新排队记录
            await tx.queueRecord.update({
                where: { id: queueRecordId },
                data: {
                    chargingPileId,
                    status: 'CHARGING'
                }
            });
            // 创建充电记录
            await tx.chargingRecord.create({
                data: {
                    recordNumber,
                    userId: queueRecord.userId,
                    chargingPileId,
                    requestedAmount: queueRecord.requestedAmount,
                    actualAmount: 0, // 开始时为0，充电完成后更新
                    chargingTime: 0,
                    startTime: new Date(),
                    chargingFee,
                    serviceFee,
                    totalFee,
                    status: 'CHARGING'
                }
            });
        });
    }
    // 更新充电状态（模拟充电过程）
    async updateChargingStatus() {
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
                // 计算充电时长（分钟）
                const chargingTimeMinutes = Math.floor((new Date().getTime() - record.startTime.getTime()) / (1000 * 60));
                // 根据充电桩功率计算实际充电量
                const powerKWH = record.chargingPile.power;
                const actualAmount = Math.min((chargingTimeMinutes / 60) * powerKWH, record.requestedAmount);
                // 更新充电记录
                await this.prisma.chargingRecord.update({
                    where: { id: record.id },
                    data: {
                        actualAmount,
                        chargingTime: chargingTimeMinutes / 60
                    }
                });
                // 检查是否充电完成
                if (actualAmount >= record.requestedAmount) {
                    await this.completeCharging(record.id);
                }
                // 实时通知用户充电进度
                this.socketService.notifyUser(record.userId, {
                    type: 'charging_progress',
                    data: {
                        recordNumber: record.recordNumber,
                        actualAmount: parseFloat(actualAmount.toFixed(2)),
                        requestedAmount: record.requestedAmount,
                        progress: Math.floor((actualAmount / record.requestedAmount) * 100)
                    }
                });
            }
        }
        catch (error) {
            console.error('更新充电状态错误:', error);
        }
    }
    // 完成充电
    async completeCharging(recordId) {
        try {
            const record = await this.prisma.chargingRecord.findUnique({
                where: { id: recordId },
                include: {
                    user: true,
                    chargingPile: true
                }
            });
            if (!record)
                return;
            // 重新计算实际费用
            const chargingFeeRate = parseFloat((await this.getSystemConfig(record.chargingPile.type === 'FAST' ? 'charging_fee_fast' : 'charging_fee_slow')) || '1.0');
            const serviceFeeRate = parseFloat((await this.getSystemConfig(record.chargingPile.type === 'FAST' ? 'service_fee_fast' : 'service_fee_slow')) || '0.5');
            const actualChargingFee = record.actualAmount * chargingFeeRate;
            const actualServiceFee = record.actualAmount * serviceFeeRate;
            const actualTotalFee = actualChargingFee + actualServiceFee;
            // 事务处理：完成充电并释放充电桩
            await this.prisma.$transaction(async (tx) => {
                // 更新充电记录为已完成
                await tx.chargingRecord.update({
                    where: { id: recordId },
                    data: {
                        endTime: new Date(),
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
            // 通知用户充电完成
            this.socketService.notifyUser(record.userId, {
                type: 'charging_completed',
                data: {
                    recordNumber: record.recordNumber,
                    chargingPile: record.chargingPile.name,
                    actualAmount: record.actualAmount,
                    totalFee: actualTotalFee,
                    message: '充电已完成，请及时移走车辆'
                }
            });
            console.log(`充电完成 - 详单号: ${record.recordNumber}, 充电桩: ${record.chargingPile.name}`);
        }
        catch (error) {
            console.error('完成充电错误:', error);
        }
    }
    // 生成充电详单编号
    async generateRecordNumber() {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
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
    async getSystemConfig(key) {
        const config = await this.prisma.systemConfig.findUnique({
            where: { key }
        });
        return config?.value || null;
    }
    // 手动分配充电桩（供管理员使用）
    async manualAssignPile(queueRecordId, chargingPileId) {
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
        }
        catch (error) {
            console.error('手动分配充电桩错误:', error);
            throw error;
        }
    }
    // 紧急停止充电
    async emergencyStopCharging(recordId, reason = '紧急停止') {
        try {
            await this.prisma.$transaction(async (tx) => {
                // 更新充电记录
                await tx.chargingRecord.update({
                    where: { id: recordId },
                    data: {
                        endTime: new Date(),
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
        }
        catch (error) {
            console.error('紧急停止充电错误:', error);
            throw error;
        }
    }
}
exports.ChargingSystemService = ChargingSystemService;
