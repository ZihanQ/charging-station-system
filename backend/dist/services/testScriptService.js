"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testScriptService = exports.TestScriptService = void 0;
const client_1 = require("@prisma/client");
const virtualTimeService_1 = require("./virtualTimeService");
const prisma = new client_1.PrismaClient();
class TestScriptService {
    constructor() {
        this.scripts = [];
        this.isRunning = false;
        this.checkInterval = null;
        this.startTaskMonitoring();
    }
    static getInstance() {
        if (!TestScriptService.instance) {
            TestScriptService.instance = new TestScriptService();
        }
        return TestScriptService.instance;
    }
    // 创建测试脚本
    createScript(script) {
        const newScript = {
            ...script,
            id: `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        this.scripts.push(newScript);
        console.log(`测试脚本创建成功: ${newScript.name}`);
        return newScript;
    }
    // 获取所有测试脚本
    getAllScripts() {
        return this.scripts;
    }
    // 获取特定测试脚本
    getScript(scriptId) {
        return this.scripts.find(s => s.id === scriptId);
    }
    // 启用/禁用测试脚本
    toggleScript(scriptId, isActive) {
        const script = this.scripts.find(s => s.id === scriptId);
        if (script) {
            script.isActive = isActive;
            console.log(`测试脚本 ${script.name} 已${isActive ? '启用' : '禁用'}`);
            return true;
        }
        return false;
    }
    // 删除测试脚本
    deleteScript(scriptId) {
        const index = this.scripts.findIndex(s => s.id === scriptId);
        if (index !== -1) {
            const script = this.scripts[index];
            this.scripts.splice(index, 1);
            console.log(`测试脚本 ${script.name} 已删除`);
            return true;
        }
        return false;
    }
    // 开始监控任务执行
    startTaskMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this.checkInterval = setInterval(() => {
            this.checkAndExecuteTasks();
        }, 1000); // 每秒检查一次
        this.isRunning = true;
        console.log('测试脚本监控已启动');
    }
    // 停止监控任务执行
    stopTaskMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isRunning = false;
        console.log('测试脚本监控已停止');
    }
    // 检查并执行到期的任务
    async checkAndExecuteTasks() {
        if (!this.isRunning)
            return;
        const currentTime = virtualTimeService_1.virtualTimeService.getCurrentTime();
        for (const script of this.scripts) {
            if (!script.isActive)
                continue;
            for (const task of script.tasks) {
                if (task.isExecuted)
                    continue;
                // 检查是否到了执行时间
                if (currentTime >= task.triggerTime) {
                    try {
                        await this.executeTask(script, task);
                        task.isExecuted = true;
                        task.executedAt = currentTime;
                        console.log(`任务执行成功: ${script.name} - ${task.action} at ${currentTime.toLocaleString('zh-CN')}`);
                    }
                    catch (error) {
                        console.error(`任务执行失败: ${script.name} - ${task.action}`, error);
                    }
                }
            }
        }
    }
    // 执行具体任务
    async executeTask(script, task) {
        switch (task.action) {
            case 'CREATE_CHARGING_REQUEST':
                await this.createChargingRequest(task);
                break;
            case 'MODIFY_REQUEST':
                await this.modifyChargingRequest(task);
                break;
            case 'CANCEL_REQUEST':
                await this.cancelChargingRequest(task);
                break;
            default:
                throw new Error(`未知的任务类型: ${task.action}`);
        }
    }
    // 创建充电请求
    async createChargingRequest(task) {
        // 检查用户是否存在
        const user = await prisma.user.findUnique({
            where: { id: task.userId }
        });
        if (!user) {
            throw new Error(`用户不存在: ${task.userId}`);
        }
        // 检查用户是否已有未完成的请求
        const existingRequest = await prisma.queueRecord.findFirst({
            where: {
                userId: task.userId,
                status: {
                    in: ['WAITING', 'CHARGING']
                }
            }
        });
        if (existingRequest) {
            console.log(`用户 ${task.userId} 已有未完成的充电请求，跳过创建新请求`);
            return;
        }
        // 生成排队号码
        const queueNumber = await this.generateQueueNumber(task.chargingMode);
        // 创建排队记录
        await prisma.queueRecord.create({
            data: {
                queueNumber,
                userId: task.userId,
                chargingMode: task.chargingMode,
                requestedAmount: task.requestedAmount,
                batteryCapacity: task.requestedAmount * 2, // 假设电池容量是请求充电量的2倍
                position: 0, // 初始位置设为0，后续会由调度系统更新
                status: 'WAITING',
                createdAt: virtualTimeService_1.virtualTimeService.getCurrentTime()
            }
        });
        console.log(`自动创建充电请求: 用户${task.userId}, 模式${task.chargingMode}, 电量${task.requestedAmount}度, 排队号${queueNumber}`);
    }
    // 修改充电请求
    async modifyChargingRequest(task) {
        const queueRecord = await prisma.queueRecord.findFirst({
            where: {
                userId: task.userId,
                status: 'WAITING'
            }
        });
        if (!queueRecord) {
            console.log(`用户 ${task.userId} 没有可修改的充电请求`);
            return;
        }
        await prisma.queueRecord.update({
            where: { id: queueRecord.id },
            data: {
                requestedAmount: task.requestedAmount,
                updatedAt: virtualTimeService_1.virtualTimeService.getCurrentTime()
            }
        });
        console.log(`自动修改充电请求: 用户${task.userId}, 新电量${task.requestedAmount}度`);
    }
    // 取消充电请求
    async cancelChargingRequest(task) {
        const queueRecord = await prisma.queueRecord.findFirst({
            where: {
                userId: task.userId,
                status: {
                    in: ['WAITING', 'CHARGING']
                }
            }
        });
        if (!queueRecord) {
            console.log(`用户 ${task.userId} 没有可取消的充电请求`);
            return;
        }
        await prisma.queueRecord.update({
            where: { id: queueRecord.id },
            data: {
                status: 'CANCELLED',
                updatedAt: virtualTimeService_1.virtualTimeService.getCurrentTime()
            }
        });
        console.log(`自动取消充电请求: 用户${task.userId}`);
    }
    // 生成排队号码
    async generateQueueNumber(chargingMode) {
        const prefix = chargingMode === 'FAST' ? 'F' : 'T';
        const lastRecord = await prisma.queueRecord.findFirst({
            where: {
                queueNumber: {
                    startsWith: prefix
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        let nextNumber = 1;
        if (lastRecord) {
            const lastNumber = parseInt(lastRecord.queueNumber.substring(1));
            nextNumber = lastNumber + 1;
        }
        return `${prefix}${nextNumber}`;
    }
    // 创建预定义的测试场景
    createDefaultTestScenarios() {
        // 场景1: 峰谷时段对比测试
        const peakValleyTest = {
            id: 'scenario_peak_valley',
            name: '峰谷时段对比测试',
            description: '在6点(谷时)和14点(峰时)各安排几辆车充电，对比电费差异',
            isActive: false,
            tasks: [
                {
                    id: 'task_1',
                    triggerTime: new Date('2024-01-01T06:00:00'),
                    action: 'CREATE_CHARGING_REQUEST',
                    userId: 'test_user_1',
                    chargingMode: 'FAST',
                    requestedAmount: 20,
                    isExecuted: false
                },
                {
                    id: 'task_2',
                    triggerTime: new Date('2024-01-01T06:05:00'),
                    action: 'CREATE_CHARGING_REQUEST',
                    userId: 'test_user_2',
                    chargingMode: 'SLOW',
                    requestedAmount: 15,
                    isExecuted: false
                },
                {
                    id: 'task_3',
                    triggerTime: new Date('2024-01-01T14:00:00'),
                    action: 'CREATE_CHARGING_REQUEST',
                    userId: 'test_user_3',
                    chargingMode: 'FAST',
                    requestedAmount: 20,
                    isExecuted: false
                },
                {
                    id: 'task_4',
                    triggerTime: new Date('2024-01-01T14:05:00'),
                    action: 'CREATE_CHARGING_REQUEST',
                    userId: 'test_user_4',
                    chargingMode: 'SLOW',
                    requestedAmount: 15,
                    isExecuted: false
                }
            ]
        };
        // 场景2: 调度策略测试
        const schedulingTest = {
            id: 'scenario_scheduling',
            name: '调度策略测试',
            description: '测试系统的调度策略，观察车辆如何分配到不同充电桩',
            isActive: false,
            tasks: [
                {
                    id: 'task_5',
                    triggerTime: new Date('2024-01-01T08:00:00'),
                    action: 'CREATE_CHARGING_REQUEST',
                    userId: 'test_user_5',
                    chargingMode: 'FAST',
                    requestedAmount: 30,
                    isExecuted: false
                },
                {
                    id: 'task_6',
                    triggerTime: new Date('2024-01-01T08:02:00'),
                    action: 'CREATE_CHARGING_REQUEST',
                    userId: 'test_user_6',
                    chargingMode: 'FAST',
                    requestedAmount: 10,
                    isExecuted: false
                },
                {
                    id: 'task_7',
                    triggerTime: new Date('2024-01-01T08:05:00'),
                    action: 'CREATE_CHARGING_REQUEST',
                    userId: 'test_user_7',
                    chargingMode: 'FAST',
                    requestedAmount: 25,
                    isExecuted: false
                }
            ]
        };
        this.scripts.push(peakValleyTest, schedulingTest);
        console.log('默认测试场景已创建');
    }
    // 重置所有任务状态
    resetAllTasks() {
        this.scripts.forEach(script => {
            script.tasks.forEach(task => {
                task.isExecuted = false;
                task.executedAt = undefined;
            });
        });
        console.log('所有测试任务状态已重置');
    }
    // 获取服务状态
    getStatus() {
        return {
            isRunning: this.isRunning,
            scriptsCount: this.scripts.length,
            activeScriptsCount: this.scripts.filter(s => s.isActive).length,
            totalTasks: this.scripts.reduce((sum, script) => sum + script.tasks.length, 0),
            executedTasks: this.scripts.reduce((sum, script) => sum + script.tasks.filter(task => task.isExecuted).length, 0)
        };
    }
}
exports.TestScriptService = TestScriptService;
// 导出单例实例
exports.testScriptService = TestScriptService.getInstance();
