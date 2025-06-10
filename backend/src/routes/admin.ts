import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import Joi from 'joi';

const router = express.Router();
const prisma = new PrismaClient();

// 应用认证和管理员权限中间件
router.use(authenticateToken);
router.use(requireAdmin);

// 获取系统概览
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    // 获取统计数据
    const [
      totalUsers,
      totalChargingPiles,
      todayChargingCount,
      currentQueue,
      todayRevenue,
      todayPowerConsumption
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.chargingPile.count(),
      prisma.chargingRecord.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.queueRecord.count({
        where: {
          status: {
            in: ['WAITING', 'IN_QUEUE', 'CHARGING']
          }
        }
      }),
      prisma.chargingRecord.aggregate({
        _sum: {
          totalFee: true
        },
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          },
          status: 'COMPLETED'
        }
      }),
      prisma.chargingRecord.aggregate({
        _sum: {
          actualAmount: true
        },
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          },
          status: 'COMPLETED'
        }
      })
    ]);

    // 获取充电桩状态统计
    const pileStatusStats = await prisma.chargingPile.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    // 计算正常充电桩和故障充电桩数量
    const normalPiles = pileStatusStats.find(s => s.status === 'NORMAL')?._count.status || 0;
    const faultPiles = pileStatusStats.find(s => s.status === 'FAULT')?._count.status || 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalChargingPiles,
        normalPiles,
        currentQueue,
        faultPiles,
        todayRevenue: todayRevenue._sum.totalFee || 0,
        todayChargingCount,
        todayPowerConsumption: todayPowerConsumption._sum.actualAmount || 0
      }
    });

  } catch (error) {
    console.error('获取管理员仪表板数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

// 获取所有用户列表
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'USER' },
        select: {
          id: true,
          username: true,
          email: true,
          phoneNumber: true,
          createdAt: true,
          _count: {
            select: {
              chargingRecords: true,
              queueRecords: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where: { role: 'USER' } })
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pageSize: limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

// 获取充电桩列表
router.get('/piles', async (req: Request, res: Response) => {
  try {
    const chargingPiles = await prisma.chargingPile.findMany({
      include: {
        _count: {
          select: {
            chargingRecords: true,
            queueRecords: {
              where: {
                status: {
                  in: ['IN_QUEUE', 'CHARGING']
                }
              }
            }
          }
        }
      },
      orderBy: { position: 'asc' }
    });

    res.json({
      success: true,
      data: chargingPiles.map(pile => ({
        id: pile.id,
        name: pile.name,
        type: pile.type,
        power: pile.power,
        status: pile.status,
        position: pile.position,
        totalRecords: pile._count.chargingRecords,
        currentQueue: pile._count.queueRecords,
        createdAt: pile.createdAt,
        updatedAt: pile.updatedAt
      }))
    });

  } catch (error) {
    console.error('获取充电桩列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取充电桩列表失败'
    });
  }
});

// 更新充电桩状态
router.patch('/piles/:pileId/status', async (req: Request, res: Response) => {
  try {
    const { pileId } = req.params;
    const { status } = req.body;

    // 验证状态值
    const validStatuses = ['NORMAL', 'FAULT', 'DISABLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的充电桩状态'
      });
    }

    const updatedPile = await prisma.chargingPile.update({
      where: { id: pileId },
      data: { status }
    });

    res.json({
      success: true,
      message: '充电桩状态更新成功',
      data: updatedPile
    });

  } catch (error) {
    console.error('更新充电桩状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新充电桩状态失败'
    });
  }
});

// 获取排队管理数据
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const queueRecords = await prisma.queueRecord.findMany({
      where: {
        status: {
          in: ['WAITING', 'IN_QUEUE', 'CHARGING']
        }
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        chargingPile: {
          select: {
            name: true,
            type: true
          }
        }
      },
      orderBy: [
        { chargingMode: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // 格式化数据为前端期望的格式
    const formattedRecords = queueRecords.map(record => ({
      id: record.id,
      queueNumber: record.queueNumber,
      username: record.user.username,
      chargingMode: record.chargingMode,
      requestedAmount: record.requestedAmount,
      position: record.position,
      status: record.status,
      waitingTime: calculateWaitingTime(record.createdAt),
      createdAt: record.createdAt.toISOString()
    }));

    res.json({
      success: true,
      data: formattedRecords
    });

  } catch (error) {
    console.error('获取排队管理数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取排队数据失败'
    });
  }
});

// 计算等待时间的辅助函数
function calculateWaitingTime(createdAt: Date): string {
  const now = new Date();
  const diff = now.getTime() - createdAt.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else {
    return `${minutes}分钟`;
  }
}

// 手动分配充电桩
router.post('/queue/:queueId/assign', async (req: Request, res: Response) => {
  try {
    const { queueId } = req.params;
    const { chargingPileId } = req.body;

    // 检查充电桩是否可用
    const chargingPile = await prisma.chargingPile.findUnique({
      where: { id: chargingPileId }
    });

    if (!chargingPile || chargingPile.status !== 'NORMAL') {
      return res.status(400).json({
        success: false,
        message: '充电桩不可用'
      });
    }

    // 检查充电桩是否已被占用
    const existingAssignment = await prisma.queueRecord.findFirst({
      where: {
        chargingPileId,
        status: {
          in: ['IN_QUEUE', 'CHARGING']
        }
      }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: '充电桩已被占用'
      });
    }

    // 更新排队记录
    const updatedRecord = await prisma.queueRecord.update({
      where: { id: queueId },
      data: {
        chargingPileId,
        status: 'IN_QUEUE'
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        chargingPile: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: '充电桩分配成功',
      data: updatedRecord
    });

  } catch (error) {
    console.error('分配充电桩错误:', error);
    res.status(500).json({
      success: false,
      message: '分配充电桩失败'
    });
  }
});

// 获取充电记录
router.get('/records', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};
    if (status && status !== 'ALL') {
      whereCondition.status = status;
    }

    const [records, total] = await Promise.all([
      prisma.chargingRecord.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              username: true,
              email: true
            }
          },
          chargingPile: {
            select: {
              name: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.chargingRecord.count({ where: whereCondition })
    ]);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          current: page,
          pageSize: limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取充电记录错误:', error);
    res.status(500).json({
      success: false,
      message: '获取充电记录失败'
    });
  }
});

// 获取系统统计数据
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    // 获取今日、本周、本月的统计数据
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // 获取今日统计
    const [todayStats, thisWeekStats, thisMonthStats] = await Promise.all([
      prisma.chargingRecord.aggregate({
        _count: { id: true },
        _sum: { 
          totalFee: true,
          actualAmount: true 
        },
        where: {
          createdAt: { gte: today },
          status: 'COMPLETED'
        }
      }),
      prisma.chargingRecord.aggregate({
        _count: { id: true },
        _sum: { 
          totalFee: true,
          actualAmount: true 
        },
        where: {
          createdAt: { gte: thisWeekStart },
          status: 'COMPLETED'
        }
      }),
      prisma.chargingRecord.aggregate({
        _count: { id: true },
        _sum: { 
          totalFee: true,
          actualAmount: true 
        },
        where: {
          createdAt: { gte: thisMonthStart },
          status: 'COMPLETED'
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        today: {
          chargingCount: todayStats._count.id || 0,
          powerConsumption: todayStats._sum.actualAmount || 0,
          revenue: todayStats._sum.totalFee || 0
        },
        thisWeek: {
          chargingCount: thisWeekStats._count.id || 0,
          powerConsumption: thisWeekStats._sum.actualAmount || 0,
          revenue: thisWeekStats._sum.totalFee || 0
        },
        thisMonth: {
          chargingCount: thisMonthStats._count.id || 0,
          powerConsumption: thisMonthStats._sum.actualAmount || 0,
          revenue: thisMonthStats._sum.totalFee || 0
        }
      }
    });

  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

export default router; 