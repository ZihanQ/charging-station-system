"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChargingSystemService = void 0;
const client_1 = require("@prisma/client");
class ChargingSystemService {
    constructor(socketService) {
        this.prisma = new client_1.PrismaClient();
        this.socketService = socketService;
    }
    // 初始化充电系统
    async initialize() {
        console.log('正在初始化充电调度系统...');
        // 初始化充电桩数据
        await this.initializeChargingPiles();
        // 启动调度服务
        this.startSchedulingService();
        console.log('充电调度系统初始化完成');
    }
    // 初始化充电桩数据
    async initializeChargingPiles() {
        const existingPiles = await this.prisma.chargingPile.count();
        if (existingPiles === 0) {
            // 创建快充桩A、B
            await this.prisma.chargingPile.createMany({
                data: [
                    { name: 'A', type: 'FAST', power: 30, position: 1 },
                    { name: 'B', type: 'FAST', power: 30, position: 2 },
                    { name: 'C', type: 'SLOW', power: 7, position: 3 },
                    { name: 'D', type: 'SLOW', power: 7, position: 4 },
                    { name: 'E', type: 'SLOW', power: 7, position: 5 }
                ]
            });
            console.log('充电桩数据初始化完成');
        }
    }
    // 启动调度服务
    startSchedulingService() {
        // 定时检查排队情况和调度
        setInterval(() => {
            this.processQueue();
        }, 5000); // 每5秒检查一次
    }
    // 处理排队调度
    async processQueue() {
        // 这里实现调度逻辑
        // 暂时先输出日志
        console.log('执行排队调度检查...');
    }
}
exports.ChargingSystemService = ChargingSystemService;
