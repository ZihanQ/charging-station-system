import { Router, Request, Response } from 'express';
import { testScriptService, TestScript } from '../services/testScriptService';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// 获取所有测试脚本
router.get('/scripts', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const scripts = testScriptService.getAllScripts();
    res.json({
      success: true,
      data: scripts
    });
  } catch (error) {
    console.error('获取测试脚本错误:', error);
    res.status(500).json({
      success: false,
      message: '获取测试脚本失败'
    });
  }
});

// 获取特定测试脚本
router.get('/scripts/:scriptId', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const { scriptId } = req.params;
    const script = testScriptService.getScript(scriptId);
    
    if (!script) {
      return res.status(404).json({
        success: false,
        message: '测试脚本不存在'
      });
    }

    res.json({
      success: true,
      data: script
    });
  } catch (error) {
    console.error('获取测试脚本错误:', error);
    res.status(500).json({
      success: false,
      message: '获取测试脚本失败'
    });
  }
});

// 创建测试脚本
router.post('/scripts', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const { name, description, tasks } = req.body;
    
    if (!name || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        message: '脚本名称和任务列表不能为空'
      });
    }

    const script = testScriptService.createScript({
      name,
      description: description || '',
      isActive: false,
      tasks: tasks.map((task: any) => ({
        ...task,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        triggerTime: new Date(task.triggerTime),
        requestedAmount: parseFloat(task.requestedAmount),
        isExecuted: false
      }))
    });

    res.json({
      success: true,
      message: '测试脚本创建成功',
      data: script
    });
  } catch (error) {
    console.error('创建测试脚本错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '创建测试脚本失败'
    });
  }
});

// 启用/禁用测试脚本
router.patch('/scripts/:scriptId/toggle', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const { scriptId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive 参数必须是布尔值'
      });
    }

    const success = testScriptService.toggleScript(scriptId, isActive);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '测试脚本不存在'
      });
    }

    res.json({
      success: true,
      message: `测试脚本已${isActive ? '启用' : '禁用'}`,
      data: testScriptService.getScript(scriptId)
    });
  } catch (error) {
    console.error('切换测试脚本状态错误:', error);
    res.status(500).json({
      success: false,
      message: '切换测试脚本状态失败'
    });
  }
});

// 删除测试脚本
router.delete('/scripts/:scriptId', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const { scriptId } = req.params;
    
    const success = testScriptService.deleteScript(scriptId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '测试脚本不存在'
      });
    }

    res.json({
      success: true,
      message: '测试脚本删除成功'
    });
  } catch (error) {
    console.error('删除测试脚本错误:', error);
    res.status(500).json({
      success: false,
      message: '删除测试脚本失败'
    });
  }
});

// 创建默认测试场景
router.post('/default-scenarios', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    testScriptService.createDefaultTestScenarios();
    
    res.json({
      success: true,
      message: '默认测试场景创建成功',
      data: testScriptService.getAllScripts()
    });
  } catch (error) {
    console.error('创建默认测试场景错误:', error);
    res.status(500).json({
      success: false,
      message: '创建默认测试场景失败'
    });
  }
});

// 重置所有任务状态
router.post('/reset-tasks', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    testScriptService.resetAllTasks();
    
    res.json({
      success: true,
      message: '所有测试任务状态已重置',
      data: testScriptService.getAllScripts()
    });
  } catch (error) {
    console.error('重置测试任务错误:', error);
    res.status(500).json({
      success: false,
      message: '重置测试任务失败'
    });
  }
});

// 清理测试数据
router.post('/cleanup-test-data', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // 删除所有测试用户的排队记录和充电记录
    const deletedQueueRecords = await prisma.queueRecord.deleteMany({
      where: {
        userId: {
          startsWith: 'test_user_'
        }
      }
    });
    
    const deletedChargingRecords = await prisma.chargingRecord.deleteMany({
      where: {
        userId: {
          startsWith: 'test_user_'
        }
      }
    });
    
    console.log(`清理测试数据完成 - 排队记录: ${deletedQueueRecords.count}, 充电记录: ${deletedChargingRecords.count}`);
    
    res.json({
      success: true,
      message: '测试数据清理完成',
      data: {
        deletedQueueRecords: deletedQueueRecords.count,
        deletedChargingRecords: deletedChargingRecords.count
      }
    });
  } catch (error) {
    console.error('清理测试数据错误:', error);
    res.status(500).json({
      success: false,
      message: '清理测试数据失败'
    });
  }
});

// 获取测试脚本服务状态
router.get('/status', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const status = testScriptService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('获取测试脚本服务状态错误:', error);
    res.status(500).json({
      success: false,
      message: '获取测试脚本服务状态失败'
    });
  }
});

// 获取详细的调试信息
router.get('/debug-info', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const scripts = testScriptService.getAllScripts();
    const status = testScriptService.getStatus();
    
    // 引入虚拟时间服务来获取当前时间
    const { virtualTimeService } = require('../services/virtualTimeService');
    const currentTime = virtualTimeService.getCurrentTime();
    const timeStatus = virtualTimeService.getStatus();
    
    // 计算每个任务的执行状态
    const taskDetails = scripts.map(script => ({
      ...script,
      tasks: script.tasks.map(task => {
        const timeDiff = task.triggerTime.getTime() - currentTime.getTime();
        return {
          ...task,
          triggerTimeFormatted: task.triggerTime.toLocaleString('zh-CN'),
          timeUntilExecution: Math.round(timeDiff / 1000),
          shouldExecute: currentTime >= task.triggerTime,
          executedAtFormatted: task.executedAt ? task.executedAt.toLocaleString('zh-CN') : null
        };
      })
    }));
    
    res.json({
      success: true,
      data: {
        serviceStatus: status,
        virtualTimeStatus: timeStatus,
        currentVirtualTime: currentTime.toLocaleString('zh-CN'),
        scripts: taskDetails
      }
    });
  } catch (error) {
    console.error('获取调试信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取调试信息失败'
    });
  }
});

// 获取状态记录文件列表
router.get('/status-logs', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const logDir = path.join(process.cwd(), 'test-script-logs');
    
    // 检查目录是否存在
    if (!fs.existsSync(logDir)) {
      return res.json({
        success: true,
        data: {
          files: [],
          message: '还没有生成状态记录文件'
        }
      });
    }
    
    // 读取目录中的文件
    const files = fs.readdirSync(logDir)
      .filter((file: string) => file.endsWith('.txt'))
      .map((file: string) => {
        const filepath = path.join(logDir, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.ctime,
          modifiedAt: stats.mtime
        };
      })
      .sort((a: any, b: any) => b.modifiedAt.getTime() - a.modifiedAt.getTime()); // 按修改时间倒序
    
    res.json({
      success: true,
      data: {
        files,
        totalFiles: files.length,
        logDirectory: logDir
      }
    });
    
  } catch (error) {
    console.error('获取状态记录文件列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取状态记录文件列表失败'
    });
  }
});

// 下载状态记录文件
router.get('/status-logs/:filename', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const fs = require('fs');
    const path = require('path');
    
    // 验证文件名安全性
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: '无效的文件名'
      });
    }
    
    const logDir = path.join(process.cwd(), 'test-script-logs');
    const filepath = path.join(logDir, filename);
    
    // 检查文件是否存在
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
    
    // 读取文件内容
    const content = fs.readFileSync(filepath, 'utf8');
    
    res.json({
      success: true,
      data: {
        filename,
        content,
        size: content.length
      }
    });
    
  } catch (error) {
    console.error('读取状态记录文件错误:', error);
    res.status(500).json({
      success: false,
      message: '读取状态记录文件失败'
    });
  }
});

// 删除所有状态记录文件
router.delete('/status-logs', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const logDir = path.join(process.cwd(), 'test-script-logs');
    
    // 检查目录是否存在
    if (!fs.existsSync(logDir)) {
      return res.json({
        success: true,
        message: '状态记录目录不存在，无需删除',
        data: {
          deletedFiles: 0,
          deletedDirectory: false
        }
      });
    }
    
    // 读取目录中的所有文件
    const files = fs.readdirSync(logDir);
    let deletedCount = 0;
    const errors: string[] = [];
    
    // 删除所有文件
    for (const file of files) {
      try {
        const filepath = path.join(logDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.isFile()) {
          fs.unlinkSync(filepath);
          deletedCount++;
          console.log(`已删除状态记录文件: ${file}`);
        }
      } catch (error) {
        console.error(`删除文件 ${file} 失败:`, error);
        errors.push(`删除文件 ${file} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
    
    // 尝试删除空目录
    let deletedDirectory = false;
    try {
      const remainingFiles = fs.readdirSync(logDir);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(logDir);
        deletedDirectory = true;
        console.log('已删除空的状态记录目录');
      }
    } catch (error) {
      console.error('删除目录失败:', error);
      errors.push(`删除目录失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
    
    const response = {
      success: true,
      message: `成功删除 ${deletedCount} 个状态记录文件${deletedDirectory ? '并删除了目录' : ''}`,
      data: {
        deletedFiles: deletedCount,
        deletedDirectory,
        errors: errors.length > 0 ? errors : undefined
      }
    };
    
    if (errors.length > 0) {
      response.message += `，但有 ${errors.length} 个错误`;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('删除状态记录文件错误:', error);
    res.status(500).json({
      success: false,
      message: '删除状态记录文件失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 删除单个状态记录文件
router.delete('/status-logs/:filename', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const fs = require('fs');
    const path = require('path');
    
    // 验证文件名安全性
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: '无效的文件名'
      });
    }
    
    const logDir = path.join(process.cwd(), 'test-script-logs');
    const filepath = path.join(logDir, filename);
    
    // 检查文件是否存在
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
    
    // 删除文件
    fs.unlinkSync(filepath);
    console.log(`已删除状态记录文件: ${filename}`);
    
    res.json({
      success: true,
      message: `文件 ${filename} 删除成功`
    });
    
  } catch (error) {
    console.error('删除状态记录文件错误:', error);
    res.status(500).json({
      success: false,
      message: '删除状态记录文件失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router; 