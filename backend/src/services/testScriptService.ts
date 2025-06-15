import { PrismaClient } from '@prisma/client';
import { virtualTimeService } from './virtualTimeService';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export interface TestScript {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  tasks: TestTask[];
}

export interface TestTask {
  id: string;
  triggerTime: Date; // 触发时间
  action: 'CREATE_CHARGING_REQUEST' | 'MODIFY_REQUEST' | 'CANCEL_REQUEST';
  userId: string;
  chargingMode: 'FAST' | 'SLOW';
  requestedAmount: number;
  isExecuted: boolean;
  executedAt?: Date;
}

export class TestScriptService {
  private static instance: TestScriptService;
  private scripts: TestScript[] = [];
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastRecordedTime: string = ''; // 记录上次记录状态的时间（格式：YYYY-MM-DD-HH-MM）

  private constructor() {
    this.startTaskMonitoring();
    // 确保日志目录存在
    this.ensureLogDirectory();
  }

  public static getInstance(): TestScriptService {
    if (!TestScriptService.instance) {
      TestScriptService.instance = new TestScriptService();
    }
    return TestScriptService.instance;
  }

  // 确保日志目录存在
  private ensureLogDirectory(): void {
    const logDir = path.join(process.cwd(), 'test-script-logs');
    console.log(`[日志目录] 检查日志目录: ${logDir}`);
    if (!fs.existsSync(logDir)) {
      console.log(`[日志目录] 创建日志目录: ${logDir}`);
      fs.mkdirSync(logDir, { recursive: true });
    } else {
      console.log(`[日志目录] 日志目录已存在: ${logDir}`);
    }
  }

  // 创建测试脚本
  public createScript(script: Omit<TestScript, 'id'>): TestScript {
    const newScript: TestScript = {
      ...script,
      id: `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.scripts.push(newScript);
    console.log(`测试脚本创建成功: ${newScript.name}`);
    return newScript;
  }

  // 获取所有测试脚本
  public getAllScripts(): TestScript[] {
    return this.scripts;
  }

  // 获取特定测试脚本
  public getScript(scriptId: string): TestScript | undefined {
    return this.scripts.find(s => s.id === scriptId);
  }

  // 启用/禁用测试脚本
  public toggleScript(scriptId: string, isActive: boolean): boolean {
    const script = this.scripts.find(s => s.id === scriptId);
    if (script) {
      script.isActive = isActive;
      console.log(`测试脚本 ${script.name} 已${isActive ? '启用' : '禁用'}`);
      return true;
    }
    return false;
  }

  // 删除测试脚本
  public deleteScript(scriptId: string): boolean {
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
  private startTaskMonitoring(): void {
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
  public stopTaskMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('测试脚本监控已停止');
  }

  // 检查并执行到期的任务
  private async checkAndExecuteTasks(): Promise<void> {
    if (!this.isRunning) return;

    const currentTime = virtualTimeService.getCurrentTime();
    
    // 检查是否需要记录状态（整点或半点）- 这个功能独立于脚本活跃状态
    await this.checkAndRecordStatus(currentTime);
    
    // 检查是否有活跃的脚本
    const activeScripts = this.scripts.filter(s => s.isActive);
    if (activeScripts.length === 0) {
      // 即使没有活跃脚本，也要定期输出时间信息（每分钟一次）
      const seconds = currentTime.getSeconds();
      if (seconds === 0) {
        console.log(`[测试脚本] 当前虚拟时间: ${currentTime.toLocaleString('zh-CN')} (无活跃脚本)`);
      }
      return;
    }
    
    // 只在有活跃脚本时输出时间日志
    console.log(`[测试脚本] 当前虚拟时间: ${currentTime.toLocaleString('zh-CN')}`);
    
    for (const script of activeScripts) {
      console.log(`[测试脚本] 检查脚本: ${script.name} (活跃)`);

      for (const task of script.tasks) {
        if (task.isExecuted) continue;

        console.log(`[测试脚本] 检查任务: ${task.action}, 触发时间: ${task.triggerTime.toLocaleString('zh-CN')}, 当前时间: ${currentTime.toLocaleString('zh-CN')}`);

        // 检查是否到了执行时间
        if (currentTime >= task.triggerTime) {
          console.log(`[测试脚本] 任务达到执行时间，开始执行: ${task.action}`);
          try {
            await this.executeTask(script, task);
            task.isExecuted = true;
            task.executedAt = currentTime;
            console.log(`任务执行成功: ${script.name} - ${task.action} at ${currentTime.toLocaleString('zh-CN')}`);
          } catch (error) {
            console.error(`任务执行失败: ${script.name} - ${task.action}`, error);
          }
        } else {
          const timeDiff = task.triggerTime.getTime() - currentTime.getTime();
          console.log(`[测试脚本] 任务还需等待 ${Math.round(timeDiff / 1000)} 秒`);
        }
      }
    }
  }

  // 检查并记录状态（整点和半点）
  private async checkAndRecordStatus(currentTime: Date): Promise<void> {
    const currentMinute = currentTime.getMinutes();
    
    // 只在整点（0分）或半点（30分）时记录
    if (currentMinute !== 0 && currentMinute !== 30) {
      return;
    }
    
    // 生成当前时间的时间键
    const currentTimeKey = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}-${String(currentTime.getHours()).padStart(2, '0')}-${String(currentMinute).padStart(2, '0')}`;
    
    // 检查是否已经记录过这个时间点
    if (this.lastRecordedTime === currentTimeKey) {
      console.log(`[状态记录] 跳过重复记录 - ${currentTime.toLocaleString('zh-CN')}`);
      return;
    }
    
    // 如果不是第一次运行，检查是否有遗漏的时间点
    if (this.lastRecordedTime !== '') {
      const lastTimeParts = this.lastRecordedTime.split('-');
      const lastYear = parseInt(lastTimeParts[0]);
      const lastMonth = parseInt(lastTimeParts[1]) - 1;
      const lastDay = parseInt(lastTimeParts[2]);
      const lastHour = parseInt(lastTimeParts[3]);
      const lastMinute = parseInt(lastTimeParts[4]);
      
      const lastRecordedDate = new Date(lastYear, lastMonth, lastDay, lastHour, lastMinute);
      const timeDiff = currentTime.getTime() - lastRecordedDate.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // 如果时间差超过0.5小时，说明可能有遗漏的记录点
      if (hoursDiff > 0.5) {
        console.log(`[状态记录] 检测到时间跳跃，从 ${lastRecordedDate.toLocaleString('zh-CN')} 到 ${currentTime.toLocaleString('zh-CN')}，时间差: ${hoursDiff.toFixed(2)}小时`);
        
        // 生成遗漏的时间点
        let checkTime = new Date(lastRecordedDate);
        checkTime.setMinutes(checkTime.getMinutes() + 30);
        
        while (checkTime < currentTime) {
          // 调整到最近的整点或半点
          const minutes = checkTime.getMinutes();
          if (minutes < 30) {
            checkTime.setMinutes(30, 0, 0);
          } else if (minutes > 30) {
            checkTime.setHours(checkTime.getHours() + 1, 0, 0, 0);
          }
          
          if (checkTime < currentTime) {
            const missedTimeKey = `${checkTime.getFullYear()}-${String(checkTime.getMonth() + 1).padStart(2, '0')}-${String(checkTime.getDate()).padStart(2, '0')}-${String(checkTime.getHours()).padStart(2, '0')}-${String(checkTime.getMinutes()).padStart(2, '0')}`;
            
            console.log(`[状态记录] 补录遗漏记录 - ${checkTime.toLocaleString('zh-CN')} (${checkTime.getMinutes() === 0 ? '整点' : '半点'})`);
            await this.recordSystemStatus(checkTime);
            
            checkTime.setMinutes(checkTime.getMinutes() + 30);
          } else {
            break;
          }
        }
      }
    }
    
    // 记录当前时间点
    console.log(`[状态记录] 触发状态记录 - ${currentTime.toLocaleString('zh-CN')} (${currentMinute === 0 ? '整点' : '半点'})`);
    this.lastRecordedTime = currentTimeKey;
    await this.recordSystemStatus(currentTime);
  }

  // 记录系统状态到文件
  private async recordSystemStatus(currentTime: Date): Promise<void> {
    try {
      console.log(`[状态记录] 记录系统状态 - ${currentTime.toLocaleString('zh-CN')}`);
      
      // 获取所有充电桩状态
      const chargingPiles = await prisma.chargingPile.findMany({
        include: {
          chargingRecords: {
            where: {
              status: 'CHARGING'
            },
            include: {
              user: {
                select: {
                  username: true
                }
              }
            },
            take: 1,
            orderBy: {
              startTime: 'desc'
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // 获取等候区状态
      const queueRecords = await prisma.queueRecord.findMany({
        where: {
          status: {
            in: ['WAITING', 'IN_QUEUE']
          }
        },
        include: {
          user: {
            select: {
              username: true
            }
          }
        },
        orderBy: [
          { chargingMode: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      // 生成状态报告
      const statusReport = this.generateStatusReport(currentTime, chargingPiles, queueRecords);
      
      // 写入文件
      await this.writeStatusToFile(currentTime, statusReport);
      
    } catch (error) {
      console.error('[状态记录] 记录系统状态失败:', error);
    }
  }

  // 生成状态报告
  private generateStatusReport(currentTime: Date, chargingPiles: any[], queueRecords: any[]): string {
    const timeStr = currentTime.toLocaleString('zh-CN');
    const timeSegment = virtualTimeService.getTimeSegment(currentTime);
    const electricityPrice = virtualTimeService.getElectricityPrice(currentTime);
    
    let report = `===========================================\n`;
    report += `测试脚本状态报告 - ${timeStr}\n`;
    report += `时段: ${timeSegment} | 电价: ${electricityPrice.toFixed(1)}元/度\n`;
    report += `===========================================\n\n`;

    // 充电桩状态
    report += `📊 充电桩状态:\n`;
    report += `┌──────┬──────┬──────┬──────────┬──────────┬──────────┐\n`;
    report += `│ 桩名 │ 类型 │ 状态 │ 用户名称 │ 已充电量 │ 当前费用 │\n`;
    report += `├──────┼──────┼──────┼──────────┼──────────┼──────────┤\n`;

    for (const pile of chargingPiles) {
      const pileStatus = pile.status === 'NORMAL' ? '正常' : pile.status === 'FAULT' ? '故障' : '关闭';
      const pileType = pile.type === 'FAST' ? '快充' : '慢充';
      
      let username = '-';
      let chargedAmount = '-';
      let currentCost = '-';
      
      if (pile.chargingRecords && pile.chargingRecords.length > 0) {
        const record = pile.chargingRecords[0];
        username = record.user.username;
        
        const requestedAmount = record.requestedAmount || 0;
        const startTime = new Date(record.startTime);
        
        // 基于实际调度算法计算预期充电量
        const theoreticalChargingTime = (currentTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // 小时
        
        // 使用与充电服务相同的功率和效率计算
        // 快充桩：30kW，慢充桩：7kW，无额外效率损失（与实际调度保持一致）
        const chargingPower = pile.type === 'FAST' ? 30 : 7; // kW
        const theoreticalAmount = theoreticalChargingTime * chargingPower;
        const estimatedAmount = Math.min(requestedAmount, Math.max(0, theoreticalAmount));
        
        // 计算充电进度
        const chargingProgress = requestedAmount > 0 ? (estimatedAmount / requestedAmount) * 100 : 0;
        
        chargedAmount = `${estimatedAmount.toFixed(1)}度`;
        
        // 基于当前时间点和电价计算预期费用
        const totalCost = this.calculateTheoreticalChargingCost(estimatedAmount, startTime, currentTime);
        currentCost = `${totalCost.toFixed(2)}元`;
        
        console.log(`[状态记录] 充电桩${pile.name}: 用户${username}, 理论充电时长${theoreticalChargingTime.toFixed(2)}h, 功率${chargingPower}kW, 预期充电量${estimatedAmount.toFixed(1)}度/${requestedAmount}度, 进度${chargingProgress.toFixed(1)}%, 预期费用${totalCost.toFixed(2)}元`);
      }
      
      report += `│ ${pile.name.padEnd(4)} │ ${pileType.padEnd(4)} │ ${pileStatus.padEnd(4)} │ ${username.padEnd(8)} │ ${chargedAmount.padEnd(8)} │ ${currentCost.padEnd(8)} │\n`;
    }
    
    report += `└──────┴──────┴──────┴──────────┴──────────┴──────────┘\n\n`;

    // 等候区状态
    report += `⏳ 等候区状态:\n`;
    
    if (queueRecords.length === 0) {
      report += `当前无车辆等待\n\n`;
    } else {
      report += `┌──────────┬──────┬──────────────┬──────────────┬──────────────┐\n`;
      report += `│ 排队号码 │ 模式 │   用户名称   │   已等待时间   │   预期等待时间   │\n`;
      report += `├──────────┼──────┼──────────────┼──────────────┼──────────────┤\n`;
      
      for (const record of queueRecords) {
        const mode = record.chargingMode === 'FAST' ? '快充' : '慢充';
        const waitedTime = this.calculateWaitedTime(new Date(record.createdAt), currentTime);
        const expectedTime = this.calculateExpectedWaitTime(record.chargingMode, record.position);
        
        report += `│ ${record.queueNumber.padEnd(8)} │ ${mode.padEnd(4)} │ ${record.user.username.padEnd(12)} │ ${waitedTime.padEnd(12)} │ ${expectedTime.padEnd(12)} │\n`;
      }
      
      report += `└──────────┴──────┴──────────────┴──────────────┴──────────────┘\n\n`;
    }

    return report;
  }

  // 计算已等待时间
  private calculateWaitedTime(createdAt: Date, currentTime: Date): string {
    const diffMs = currentTime.getTime() - createdAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}分钟`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}小时${minutes}分钟`;
    }
  }

  // 计算预期等待时间
  private calculateExpectedWaitTime(chargingMode: string, position: number): string {
    // 简化计算：快充平均30分钟，慢充平均2小时
    const avgTime = chargingMode === 'FAST' ? 30 : 120; // 分钟
    const expectedMinutes = position * avgTime;
    
    if (expectedMinutes < 60) {
      return `${expectedMinutes}分钟`;
    } else {
      const hours = Math.floor(expectedMinutes / 60);
      const minutes = expectedMinutes % 60;
      return `${hours}小时${minutes}分钟`;
    }
  }

  // 计算理论充电费用 - 与实际充电服务保持完全一致
  private calculateTheoreticalChargingCost(chargedAmount: number, startTime: Date, currentTime: Date): number {
    if (chargedAmount <= 0) return 0;
    
    // 使用与充电服务完全相同的逻辑：
    // 1. 电费 = 充电量 × 当前时段电价（使用当前时段，不分段计算）
    // 2. 服务费 = 充电量 × 0.8元/度（统一费率）
    // 3. 总费用 = 电费 + 服务费
    
    const currentElectricityPrice = virtualTimeService.getElectricityPrice(currentTime);
    const serviceFeeRate = 0.8; // 统一服务费率 0.8 元/度
    
    const electricityFee = chargedAmount * currentElectricityPrice;
    const serviceFee = chargedAmount * serviceFeeRate;
    const totalCost = electricityFee + serviceFee;
    
    console.log(`[状态记录费用] 充电量: ${chargedAmount.toFixed(1)}度, 时段: ${this.getTimePeriodName(currentTime)}, 电价: ${currentElectricityPrice}元/度, 电费: ${electricityFee.toFixed(2)}元, 服务费: ${serviceFee.toFixed(2)}元, 总计: ${totalCost.toFixed(2)}元`);
    
    return totalCost;
  }

  // 获取时段名称
  private getTimePeriodName(time: Date): string {
    const hour = time.getHours();
    if (hour >= 8 && hour < 12) return '高峰';
    if (hour >= 18 && hour < 21) return '高峰';
    if ((hour >= 12 && hour < 18) || (hour >= 21 && hour < 23)) return '平时';
    return '低谷';
  }

  // 计算充电费用 - 考虑不同时段的电价（保留原方法作为备用）
  private calculateChargingCost(chargedAmount: number, startTime: Date, currentTime: Date): number {
    return this.calculateTheoreticalChargingCost(chargedAmount, startTime, currentTime);
  }

  // 写入状态到文件
  private async writeStatusToFile(currentTime: Date, content: string): Promise<void> {
    try {
      const dateStr = currentTime.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = currentTime.toTimeString().slice(0, 5).replace(':', '-'); // HH-MM
      const filename = `charging_status_${dateStr}_${timeStr}.txt`;
      const logDir = path.join(process.cwd(), 'test-script-logs');
      const filepath = path.join(logDir, filename);
      
      // 确保目录存在
      if (!fs.existsSync(logDir)) {
        console.log(`[状态记录] 创建日志目录: ${logDir}`);
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      console.log(`[状态记录] 写入文件: ${filepath}`);
      await fs.promises.writeFile(filepath, content, { encoding: 'utf8' });
      console.log(`[状态记录] 状态已保存到文件: ${filename}`);
      
      // 同时追加到总日志文件
      const summaryFile = path.join(logDir, `charging_status_summary_${dateStr}.txt`);
      const summaryContent = `${currentTime.toLocaleString('zh-CN')} - 状态已记录\n`;
      await fs.promises.appendFile(summaryFile, summaryContent, { encoding: 'utf8' });
      
    } catch (error: any) {
      console.error('[状态记录] 写入文件失败:', error);
      console.error('[状态记录] 错误详情:', {
        message: error?.message,
        code: error?.code,
        path: error?.path
      });
    }
  }

  // 执行具体任务
  private async executeTask(script: TestScript, task: TestTask): Promise<void> {
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
  private async createChargingRequest(task: TestTask): Promise<void> {
    // 检查用户是否存在，如果不存在则创建
    let user = await prisma.user.findUnique({
      where: { id: task.userId }
    });

    if (!user) {
      console.log(`用户 ${task.userId} 不存在，自动创建测试用户`);
      try {
        // 自动创建测试用户
        const hashedPassword = await bcrypt.hash('123456', 10);
        user = await prisma.user.create({
          data: {
            id: task.userId,
            username: task.userId.replace('test_user_', 'testuser'),
            email: `${task.userId}@example.com`,
            password: hashedPassword,
            phoneNumber: `1380000000${task.userId.slice(-1)}`,
            role: 'USER'
          }
        });
        console.log(`测试用户 ${task.userId} 创建成功`);
      } catch (createError) {
        throw new Error(`创建测试用户失败: ${task.userId}, 错误: ${createError}`);
      }
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

    // 重试机制：最多重试3次
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // 生成排队号码
        const queueNumber = await this.generateQueueNumber(task.chargingMode);

        // 创建排队记录
        await prisma.queueRecord.create({
          data: {
            queueNumber,
            userId: task.userId,
            chargingMode: task.chargingMode,
            requestedAmount: typeof task.requestedAmount === 'string' ? parseFloat(task.requestedAmount) : task.requestedAmount,
            batteryCapacity: (typeof task.requestedAmount === 'string' ? parseFloat(task.requestedAmount) : task.requestedAmount) * 2, // 假设电池容量是请求充电量的2倍
            position: 0, // 初始位置设为0，后续会由调度系统更新
            status: 'WAITING',
            createdAt: virtualTimeService.getCurrentTime()
          }
        });

        console.log(`自动创建充电请求: 用户${task.userId}, 模式${task.chargingMode}, 电量${task.requestedAmount}度, 排队号${queueNumber}`);
        return; // 成功创建，退出重试循环
        
      } catch (error: any) {
        retryCount++;
        
        // 如果是唯一约束错误，等待一小段时间后重试
        if (error.code === 'P2002' && retryCount < maxRetries) {
          console.log(`创建充电请求失败(重复排队号)，第${retryCount}次重试...`);
          // 等待随机时间(100-500ms)再重试
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
          continue;
        }
        
        // 如果是其他错误或重试次数已达上限，抛出错误
        console.error(`创建充电请求失败，用户: ${task.userId}, 重试次数: ${retryCount}/${maxRetries}`, error);
        throw error;
      }
    }
    
    throw new Error(`创建充电请求失败: 用户${task.userId}, 已达到最大重试次数${maxRetries}`);
  }

  // 修改充电请求
  private async modifyChargingRequest(task: TestTask): Promise<void> {
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

    const requestedAmount = typeof task.requestedAmount === 'string' ? parseFloat(task.requestedAmount) : task.requestedAmount;

    await prisma.queueRecord.update({
      where: { id: queueRecord.id },
      data: {
        requestedAmount: requestedAmount,
        updatedAt: virtualTimeService.getCurrentTime()
      }
    });

    console.log(`自动修改充电请求: 用户${task.userId}, 新电量${requestedAmount}度`);
  }

  // 取消充电请求
  private async cancelChargingRequest(task: TestTask): Promise<void> {
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
        updatedAt: virtualTimeService.getCurrentTime()
      }
    });

    console.log(`自动取消充电请求: 用户${task.userId}`);
  }

  // 生成排队号码 - 适配数据库VARCHAR(10)限制
  private async generateQueueNumber(chargingMode: 'FAST' | 'SLOW'): Promise<string> {
    const prefix = chargingMode === 'FAST' ? 'F' : 'T';
    
    console.log(`[排队号码生成] 开始为 ${chargingMode} 模式生成排队号码`);
    
    // 最多重试50次来避免冲突
    let retryCount = 0;
    const maxRetries = 50;
    
    while (retryCount < maxRetries) {
      try {
        // 使用时间戳 + 随机数的方式生成唯一号码
        const timestamp = Date.now().toString().slice(-4); // 取时间戳后4位
        const random = Math.floor(Math.random() * 100); // 0-99的随机数
        
        let queueNumber: string;
        
        // 如果重试次数较少，先尝试简单的递增编号
        if (retryCount < 20) {
          // 查找当前最大的数字编号
          const existingNumbers = await prisma.queueRecord.findMany({
            where: {
              queueNumber: {
                startsWith: prefix
              }
            },
            select: {
              queueNumber: true
            }
          });
          
          // 提取所有数字部分并找到最大值
          const numbers = existingNumbers
            .map(record => {
              const numPart = record.queueNumber.substring(1);
              return isNaN(parseInt(numPart)) ? 0 : parseInt(numPart);
            })
            .filter(num => num > 0);
          
          const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
          queueNumber = `${prefix}${maxNumber + 1 + retryCount}`;
          
          console.log(`[排队号码生成] 尝试递增编号: ${queueNumber} (最大现有编号: ${maxNumber})`);
        } else {
          // 重试次数较多时，使用时间戳+随机数
          queueNumber = `${prefix}${timestamp}${random}`;
          console.log(`[排队号码生成] 尝试时间戳编号: ${queueNumber}`);
        }
        
        // 确保不超过10字符限制
        if (queueNumber.length > 10) {
          console.log(`[排队号码生成] 号码太长 (${queueNumber.length}字符)，使用短格式`);
          // 使用更短的格式：前缀 + 3位随机数
          const shortRandom = Math.floor(Math.random() * 900) + 100; // 100-999
          queueNumber = `${prefix}${shortRandom}`;
        }
        
        console.log(`[排队号码生成] 尝试生成排队号码: ${queueNumber} (长度: ${queueNumber.length})`);
        
        // 检查是否已存在这个号码
        const existing = await prisma.queueRecord.findUnique({
          where: { queueNumber }
        });
        
        if (!existing) {
          console.log(`[排队号码生成] 成功生成唯一排队号码: ${queueNumber}`);
          return queueNumber;
        } else {
          console.log(`[排队号码生成] 排队号码 ${queueNumber} 已存在，继续重试 (${retryCount + 1}/${maxRetries})`);
        }
        
        retryCount++;
        
        // 添加随机延迟避免并发冲突
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5));
        
      } catch (error) {
        console.error(`[排队号码生成] 第${retryCount + 1}次尝试失败:`, error);
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error(`[排队号码生成] 达到最大重试次数 ${maxRetries}，生成失败`);
          throw new Error(`生成唯一排队号码失败，重试${maxRetries}次后仍然失败: ${error}`);
        }
        // 等待一小段时间后重试
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
      }
    }
    
    console.error(`[排队号码生成] 所有重试都失败，无法生成唯一排队号码`);
    throw new Error('生成唯一排队号码失败');
  }

  // 创建预定义的测试场景
  public createDefaultTestScenarios(): void {
    // 场景1: 峰谷时段对比测试
    const peakValleyTest: TestScript = {
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
    const schedulingTest: TestScript = {
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
  public resetAllTasks(): void {
    this.scripts.forEach(script => {
      script.tasks.forEach(task => {
        task.isExecuted = false;
        task.executedAt = undefined;
      });
    });
    console.log('所有测试任务状态已重置');
  }

  // 获取服务状态
  public getStatus() {
    return {
      isRunning: this.isRunning,
      scriptsCount: this.scripts.length,
      activeScriptsCount: this.scripts.filter(s => s.isActive).length,
      totalTasks: this.scripts.reduce((sum, script) => sum + script.tasks.length, 0),
      executedTasks: this.scripts.reduce((sum, script) => 
        sum + script.tasks.filter(task => task.isExecuted).length, 0
      )
    };
  }
}

// 导出单例实例
export const testScriptService = TestScriptService.getInstance(); 