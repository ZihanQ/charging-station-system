"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChargingSystemService = void 0;
const client_1 = require("@prisma/client");
const virtualTimeService_1 = require("./virtualTimeService");
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
        // 定时更新充电状态 - 更频繁的检查以适应虚拟时间加速
        setInterval(() => {
            this.updateChargingStatus();
        }, 2000); // 每2秒更新一次充电状态，减少虚拟时间加速时的误差
    }
    // 处理排队调度
    async processQueue() {
        if (this.isProcessing)
            return;
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
                        await this.startCharging(record.id, pile.id);
                        console.log(`成功分配充电桩 - 排队号: ${record.queueNumber}, 充电桩: ${pile.name}`);
                    }
                    catch (error) {
                        console.error(`分配充电桩失败 - 排队号: ${record.queueNumber}:`, error);
                        // 如果分配失败，将充电桩放回可用列表
                        matchingPiles.push(pile);
                    }
                }
            }
        }
        catch (error) {
            console.error('处理排队调度错误:', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    // 开始充电
    async startCharging(queueRecordId, chargingPileId) {
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
        // 获取充电桩信息以确定服务费率
        const chargingPile = await this.prisma.chargingPile.findUnique({
            where: { id: chargingPileId }
        });
        if (!chargingPile) {
            throw new Error('充电桩不存在');
        }
        // 基于虚拟时间获取电价
        const currentTime = virtualTimeService_1.virtualTimeService.getCurrentTime();
        const electricityPrice = virtualTimeService_1.virtualTimeService.getElectricityPrice(currentTime);
        const serviceFeeRate = 0.8; // 统一服务费率 0.8 元/度
        // 计算费用
        const chargingFee = queueRecord.requestedAmount * electricityPrice;
        const serviceFee = queueRecord.requestedAmount * serviceFeeRate;
        const totalFee = chargingFee + serviceFee;
        console.log(`充电开始 - 时间: ${currentTime.toLocaleString('zh-CN')}, 时段: ${virtualTimeService_1.virtualTimeService.getTimeSegment(currentTime)}, 电价: ${electricityPrice}元/度, 服务费: ${serviceFeeRate}元/度, 充电桩: ${chargingPile.name}(${chargingPile.power}kW)`);
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
                const currentTime = virtualTimeService_1.virtualTimeService.getCurrentTime();
                const powerKWH = record.chargingPile.power;
                // 计算理论充电完成时间
                const theoreticalChargingTimeHours = record.requestedAmount / powerKWH;
                const theoreticalEndTime = new Date(record.startTime.getTime() + theoreticalChargingTimeHours * 60 * 60 * 1000);
                // 检查是否应该完成充电（基于理论时间）
                if (currentTime >= theoreticalEndTime) {
                    // 充电应该完成了，直接设置为完成状态
                    await this.completeChargingWithExactTime(record.id, theoreticalEndTime);
                    console.log(`充电精确完成 - 详单号: ${record.recordNumber}, 理论完成时间: ${theoreticalEndTime.toLocaleString('zh-CN')}, 充电时长: ${theoreticalChargingTimeHours.toFixed(2)}小时`);
                    continue;
                }
                // 计算当前实际充电时长（分钟）
                const chargingTimeMinutes = Math.floor((currentTime.getTime() - record.startTime.getTime()) / (1000 * 60));
                // 根据充电桩功率计算实际充电量
                const actualAmount = Math.min((chargingTimeMinutes / 60) * powerKWH, record.requestedAmount);
                // 获取当前时段的电价
                const electricityPrice = virtualTimeService_1.virtualTimeService.getElectricityPrice(currentTime);
                const serviceFeeRate = 0.8; // 统一服务费率 0.8 元/度
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
                console.log(`充电进度更新 - 详单号: ${record.recordNumber}, 充电时长: ${(chargingTimeMinutes / 60).toFixed(2)}小时, 实际充电量: ${actualAmount.toFixed(2)}度, 进度: ${Math.floor((actualAmount / record.requestedAmount) * 100)}%, 理论完成时间: ${theoreticalEndTime.toLocaleString('zh-CN')}`);
            }
        }
        catch (error) {
            console.error('更新充电状态错误:', error);
        }
    }
    // 精确完成充电（使用指定的结束时间）
    async completeChargingWithExactTime(recordId, endTime) {
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
            // 计算精确的充电时长
            const chargingTimeHours = (endTime.getTime() - record.startTime.getTime()) / (1000 * 60 * 60);
            const actualAmount = record.requestedAmount; // 充电完成，实际充电量等于请求量
            // 获取结束时段的电价（用于最终费用计算）
            const electricityPrice = virtualTimeService_1.virtualTimeService.getElectricityPrice(endTime);
            const serviceFeeRate = 0.8; // 统一服务费率 0.8 元/度
            // 重新计算实际费用
            const actualChargingFee = actualAmount * electricityPrice;
            const actualServiceFee = actualAmount * serviceFeeRate;
            const actualTotalFee = actualChargingFee + actualServiceFee;
            // 事务处理：完成充电并释放充电桩
            await this.prisma.$transaction(async (tx) => {
                // 更新充电记录为已完成
                await tx.chargingRecord.update({
                    where: { id: recordId },
                    data: {
                        endTime: endTime,
                        actualAmount: actualAmount,
                        chargingTime: chargingTimeHours,
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
                type: 'charging_complete',
                data: {
                    recordNumber: record.recordNumber,
                    chargingPile: record.chargingPile.name,
                    actualAmount: actualAmount,
                    totalFee: actualTotalFee,
                    chargingTime: chargingTimeHours,
                    message: '充电已完成'
                }
            });
            console.log(`充电精确完成 - 详单号: ${record.recordNumber}, 充电桩: ${record.chargingPile.name}, 实际充电量: ${actualAmount}度, 充电时长: ${chargingTimeHours.toFixed(2)}小时, 总费用: ${actualTotalFee.toFixed(2)}元 (电费: ${actualChargingFee.toFixed(2)}元 + 服务费: ${actualServiceFee.toFixed(2)}元)`);
        }
        catch (error) {
            console.error('精确完成充电错误:', error);
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
            // 使用虚拟时间
            const currentTime = virtualTimeService_1.virtualTimeService.getCurrentTime();
            // 获取当前时段的电价
            const electricityPrice = virtualTimeService_1.virtualTimeService.getElectricityPrice(currentTime);
            const serviceFeeRate = 0.8; // 统一服务费率 0.8 元/度
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
            console.log(`充电完成 - 详单号: ${record.recordNumber}, 充电桩: ${record.chargingPile.name}, 实际充电量: ${record.actualAmount}度, 总费用: ${actualTotalFee.toFixed(2)}元 (电费: ${actualChargingFee.toFixed(2)}元 + 服务费: ${actualServiceFee.toFixed(2)}元)`);
        }
        catch (error) {
            console.error('完成充电错误:', error);
        }
    }
    // 生成充电详单编号 - 使用虚拟时间
    async generateRecordNumber() {
        const today = virtualTimeService_1.virtualTimeService.getCurrentTime().toISOString().split('T')[0].replace(/-/g, '');
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
                // 更新充电记录 - 使用虚拟时间
                await tx.chargingRecord.update({
                    where: { id: recordId },
                    data: {
                        endTime: virtualTimeService_1.virtualTimeService.getCurrentTime(),
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
