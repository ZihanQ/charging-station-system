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

export default router; 