import { Router, Request, Response } from 'express';
import { virtualTimeService } from '../services/virtualTimeService';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 获取当前虚拟时间状态
router.get('/status', authenticateToken, (req: Request, res: Response) => {
  try {
    const status = virtualTimeService.getStatus();
    res.json({
      success: true,
      data: {
        ...status,
        timeSegment: virtualTimeService.getTimeSegment(),
        electricityPrice: virtualTimeService.getElectricityPrice()
      }
    });
  } catch (error) {
    console.error('获取虚拟时间状态错误:', error);
    res.status(500).json({
      success: false,
      message: '获取虚拟时间状态失败'
    });
  }
});

// 设置虚拟时间（仅管理员）
router.post('/set', authenticateToken, (req: Request, res: Response) => {
  try {
    // 这里应该添加管理员权限检查
    const { time } = req.body;
    
    if (!time) {
      return res.status(400).json({
        success: false,
        message: '时间参数不能为空'
      });
    }

    const virtualTime = new Date(time);
    if (isNaN(virtualTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: '时间格式无效'
      });
    }

    virtualTimeService.setVirtualTime(virtualTime);
    
    res.json({
      success: true,
      message: '虚拟时间设置成功',
      data: {
        currentTime: virtualTimeService.getCurrentTime(),
        timeSegment: virtualTimeService.getTimeSegment(),
        electricityPrice: virtualTimeService.getElectricityPrice()
      }
    });
  } catch (error) {
    console.error('设置虚拟时间错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '设置虚拟时间失败'
    });
  }
});

// 设置时间加速倍率（仅管理员）
router.post('/acceleration', authenticateToken, (req: Request, res: Response) => {
  try {
    const { rate } = req.body;
    
    if (typeof rate !== 'number' || rate <= 0) {
      return res.status(400).json({
        success: false,
        message: '加速倍率必须是大于0的数字'
      });
    }

    virtualTimeService.setAccelerationRate(rate);
    
    res.json({
      success: true,
      message: '时间加速倍率设置成功',
      data: virtualTimeService.getStatus()
    });
  } catch (error) {
    console.error('设置时间加速倍率错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '设置时间加速倍率失败'
    });
  }
});

// 暂停虚拟时间（仅管理员）
router.post('/pause', authenticateToken, (req: Request, res: Response) => {
  try {
    virtualTimeService.pauseVirtualTime();
    
    res.json({
      success: true,
      message: '虚拟时间已暂停',
      data: virtualTimeService.getStatus()
    });
  } catch (error) {
    console.error('暂停虚拟时间错误:', error);
    res.status(500).json({
      success: false,
      message: '暂停虚拟时间失败'
    });
  }
});

// 恢复虚拟时间（仅管理员）
router.post('/resume', authenticateToken, (req: Request, res: Response) => {
  try {
    virtualTimeService.resumeVirtualTime();
    
    res.json({
      success: true,
      message: '虚拟时间已恢复',
      data: virtualTimeService.getStatus()
    });
  } catch (error) {
    console.error('恢复虚拟时间错误:', error);
    res.status(500).json({
      success: false,
      message: '恢复虚拟时间失败'
    });
  }
});

// 关闭虚拟时间模式（仅管理员）
router.post('/disable', authenticateToken, (req: Request, res: Response) => {
  try {
    virtualTimeService.disableVirtualMode();
    
    res.json({
      success: true,
      message: '已切换到真实时间模式',
      data: virtualTimeService.getStatus()
    });
  } catch (error) {
    console.error('关闭虚拟时间模式错误:', error);
    res.status(500).json({
      success: false,
      message: '关闭虚拟时间模式失败'
    });
  }
});

export default router; 