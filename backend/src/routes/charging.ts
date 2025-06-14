import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// 验证模式
const chargingRequestSchema = Joi.object({
  batteryCapacity: Joi.number().min(10).max(100).required(),
  requestedAmount: Joi.number().min(1).max(100).required(),
  chargingMode: Joi.string().valid('FAST', 'SLOW').required()
});

// 修改充电请求验证模式
const updateChargingRequestSchema = Joi.object({
  requestedAmount: Joi.number().min(1).max(100).optional(),
  chargingMode: Joi.string().valid('FAST', 'SLOW').optional()
}).or('requestedAmount', 'chargingMode');

// 应用认证中间件到所有路由
router.use(authenticateToken);

// 提交充电请求
router.post('/request', async (req: Request, res: Response) => {
  try {
    const { error, value } = chargingRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: '输入数据验证失败',
        details: error.details[0].message
      });
    }

    const { batteryCapacity, requestedAmount, chargingMode } = value;
    const userId = req.user!.id;

    // 检查用户是否已有进行中的充电请求
    const existingRequest = await prisma.queueRecord.findFirst({
      where: {
        userId,
        status: {
          in: ['WAITING', 'IN_QUEUE', 'CHARGING']
        }
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: '您已有进行中的充电请求，请等待完成后再提交新的请求'
      });
    }

    // 生成排队号码
    const queueNumber = await generateQueueNumber(chargingMode as 'FAST' | 'SLOW');
    
    // 获取队列位置
    const position = await getQueuePosition(chargingMode as 'FAST' | 'SLOW');

    // 创建排队记录
    const queueRecord = await prisma.queueRecord.create({
      data: {
        queueNumber,
        userId,
        batteryCapacity,
        requestedAmount,
        chargingMode,
        position,
        status: 'WAITING'
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '充电请求已提交',
      data: {
        queueNumber: queueRecord.queueNumber,
        position: queueRecord.position,
        estimatedTime: calculateEstimatedWaitTime(chargingMode as 'FAST' | 'SLOW', position),
        status: queueRecord.status
      }
    });

  } catch (error) {
    console.error('提交充电请求错误:', error);
    res.status(500).json({
      success: false,
      message: '提交失败，请稍后重试'
    });
  }
});

// 获取排队状态
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // 获取用户当前的排队记录
    const queueRecord = await prisma.queueRecord.findFirst({
      where: {
        userId,
        status: {
          in: ['WAITING', 'IN_QUEUE', 'CHARGING']
        }
      },
      include: {
        chargingPile: {
          select: {
            name: true,
            type: true,
            power: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!queueRecord) {
      return res.json({
        success: true,
        data: null,
        message: '当前没有排队记录'
      });
    }

    // 重新计算队列位置（实时位置）
    const currentPosition = await getCurrentQueuePosition(queueRecord.queueNumber, queueRecord.chargingMode as 'FAST' | 'SLOW');
    
    res.json({
      success: true,
      data: {
        queueNumber: queueRecord.queueNumber,
        position: currentPosition,
        estimatedTime: calculateEstimatedWaitTime(queueRecord.chargingMode as 'FAST' | 'SLOW', currentPosition),
        status: queueRecord.status,
        chargingMode: queueRecord.chargingMode,
        requestedAmount: queueRecord.requestedAmount,
        chargingPile: queueRecord.chargingPile,
        createdAt: queueRecord.createdAt
      }
    });

  } catch (error) {
    console.error('获取排队状态错误:', error);
    res.status(500).json({
      success: false,
      message: '获取排队状态失败'
    });
  }
});

// 获取充电记录
router.get('/records', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // 获取充电记录总数
    const total = await prisma.chargingRecord.count({
      where: { userId }
    });

    // 获取充电记录
    const records = await prisma.chargingRecord.findMany({
      where: { userId },
      include: {
        chargingPile: {
          select: {
            name: true,
            type: true,
            power: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    res.json({
      success: true,
      data: {
        records: records.map(record => ({
          id: record.id,
          recordNumber: record.recordNumber,
          chargingPile: record.chargingPile.name,
          chargingPileType: record.chargingPile.type,
          requestedAmount: record.requestedAmount,
          actualAmount: record.actualAmount,
          chargingTime: record.chargingTime,
          startTime: record.startTime,
          endTime: record.endTime,
          chargingFee: record.chargingFee,
          serviceFee: record.serviceFee,
          totalFee: record.totalFee,
          status: record.status,
          createdAt: record.createdAt
        })),
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

// 修改充电请求
router.put('/request/:queueNumber', async (req: Request, res: Response) => {
  try {
    const { queueNumber } = req.params;
    const userId = req.user!.id;
    const { error, value } = updateChargingRequestSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: '输入数据验证失败',
        details: error.details[0].message
      });
    }

    const { requestedAmount, chargingMode } = value;

    const queueRecord = await prisma.queueRecord.findFirst({
      where: {
        queueNumber,
        userId,
        status: { in: ['WAITING', 'IN_QUEUE'] } // 只能在等候区或充电桩队列中修改
      }
    });

    if (!queueRecord) {
      return res.status(404).json({
        success: false,
        message: '未找到可修改的充电请求或当前状态不允许修改'
      });
    }

    // 如果在充电中，不允许修改，只能取消
    if (queueRecord.status === 'CHARGING') {
      return res.status(400).json({
        success: false,
        message: '充电中不允许修改请求，请先取消充电'
      });
    }

    let newQueueNumber = queueRecord.queueNumber;
    let newPosition = queueRecord.position;

    // 修改充电模式
    if (chargingMode && chargingMode !== queueRecord.chargingMode) {
      // 只能在WAITING状态下修改模式
      if (queueRecord.status !== 'WAITING') {
        return res.status(400).json({
          success: false,
          message: '当前状态不允许修改充电模式，请先取消充电'
        });
      }
      newQueueNumber = await generateQueueNumber(chargingMode);
      newPosition = await getQueuePosition(chargingMode);
    }

    // 更新排队记录
    await prisma.queueRecord.update({
      where: { id: queueRecord.id },
      data: {
        requestedAmount: requestedAmount || queueRecord.requestedAmount,
        chargingMode: chargingMode || queueRecord.chargingMode,
        queueNumber: newQueueNumber,
        position: newPosition,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: '充电请求已修改',
      data: {
        queueNumber: newQueueNumber,
        position: newPosition,
        estimatedTime: calculateEstimatedWaitTime(chargingMode || queueRecord.chargingMode as 'FAST' | 'SLOW', newPosition),
        status: queueRecord.status
      }
    });

  } catch (error) {
    console.error('修改充电请求错误:', error);
    res.status(500).json({
      success: false,
      message: '修改请求失败，请稍后重试'
    });
  }
});

// 取消充电请求
router.delete('/request/:queueNumber', async (req: Request, res: Response) => {
  try {
    const { queueNumber } = req.params;
    const userId = req.user!.id;
    
    console.log(`取消充电请求 - 用户ID: ${userId}, 排队号码: ${queueNumber}`);

    // 首先查找所有匹配queueNumber的记录（不限制userId）
    const allMatchingRecords = await prisma.queueRecord.findMany({
      where: {
        queueNumber
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    
    console.log('所有匹配queueNumber的记录:', allMatchingRecords);
    
    // 查找当前用户的所有记录
    const userRecords = await prisma.queueRecord.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    console.log('当前用户最近的5条记录:', userRecords);

    // 简化查询条件 - 只要是当前用户的记录且queueNumber匹配就可以取消
    const queueRecord = await prisma.queueRecord.findFirst({
      where: {
        queueNumber,
        userId
      },
      include: {
        user: {
          select: {
            username: true
          }
        },
        chargingPile: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });

    console.log('查找到的排队记录:', queueRecord);

    if (!queueRecord) {
      console.log('未找到可取消的充电请求 - 详细信息:');
      console.log(`- 查询queueNumber: ${queueNumber}`);
      console.log(`- 查询userId: ${userId}`);
      
      return res.status(404).json({
        success: false,
        message: '未找到可取消的充电请求',
        debug: {
          queueNumber,
          userId,
          allMatchingRecords: allMatchingRecords.length,
          userRecords: userRecords.length
        }
      });
    }

    console.log(`当前状态: ${queueRecord.status}`);

    // 如果已经是取消状态，直接返回成功
    if (queueRecord.status === 'CANCELLED') {
      console.log('记录已经是取消状态，直接返回成功');
      return res.json({
        success: true,
        message: '充电请求已取消'
      });
    }

    // 如果用户正在充电，需要停止充电并释放充电桩
    if (queueRecord.status === 'CHARGING') {
      console.log('用户正在充电，开始停止充电流程...');
      
      // 查找对应的充电记录
      const chargingRecord = await prisma.chargingRecord.findFirst({
        where: {
          userId,
          chargingPileId: queueRecord.chargingPileId || undefined,
          status: 'CHARGING'
        }
      });

      console.log('查找到的充电记录:', chargingRecord);

      if (chargingRecord) {
        // 计算实际充电费用
        const chargingTime = (new Date().getTime() - new Date(chargingRecord.startTime).getTime()) / (1000 * 60); // 分钟
        const actualAmount = Math.min(chargingRecord.requestedAmount, chargingTime * 0.5); // 简化计算
        
        const chargingFeeRate = queueRecord.chargingMode === 'FAST' ? 1.0 : 0.8;
        const serviceFeeRate = queueRecord.chargingMode === 'FAST' ? 0.5 : 0.3;
        
        const chargingFee = actualAmount * chargingFeeRate;
        const serviceFee = actualAmount * serviceFeeRate;
        const totalFee = chargingFee + serviceFee;

        console.log(`计算费用 - 充电时长: ${chargingTime}分钟, 实际充电量: ${actualAmount}度, 总费用: ${totalFee}元`);

        // 更新充电记录
        await prisma.chargingRecord.update({
          where: { id: chargingRecord.id },
          data: {
            endTime: new Date(),
            actualAmount,
            chargingTime: chargingTime / 60,
            chargingFee,
            serviceFee,
            totalFee,
            status: 'CANCELLED'
          }
        });
        
        console.log('充电记录已更新为取消状态');
      }
    }

    // 更新队列记录状态为已取消
    await prisma.queueRecord.update({
      where: { id: queueRecord.id },
      data: { 
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });
    
    console.log('队列记录已更新为取消状态');

    // 如果取消的是正在充电的记录，需要重新安排队列
    if (queueRecord.status === 'CHARGING' && queueRecord.chargingPileId) {
      console.log('开始重新安排队列...');
      
      // 查找同类型的下一个等待充电的用户
      const nextInQueue = await prisma.queueRecord.findFirst({
        where: {
          chargingMode: queueRecord.chargingMode,
          status: 'IN_QUEUE',
          chargingPileId: queueRecord.chargingPileId
        },
        orderBy: {
          position: 'asc'
        },
        include: {
          user: {
            select: {
              id: true,
              username: true
            }
          }
        }
      });

      console.log('下一个排队用户:', nextInQueue);

      if (nextInQueue) {
        // 立即开始为下一个用户充电
        const recordNumber = await generateRecordNumber();
        
        await prisma.$transaction(async (tx) => {
          // 创建新的充电记录
          await tx.chargingRecord.create({
            data: {
              recordNumber,
              userId: nextInQueue.userId,
              chargingPileId: queueRecord.chargingPileId!,
              requestedAmount: nextInQueue.requestedAmount,
              actualAmount: 0,
              chargingTime: 0,
              startTime: new Date(),
              chargingFee: 0,
              serviceFee: 0,
              totalFee: 0,
              status: 'CHARGING'
            }
          });

          // 更新队列记录状态
          await tx.queueRecord.update({
            where: { id: nextInQueue.id },
            data: { status: 'CHARGING' }
          });
        });

        console.log(`已为下一个用户(${nextInQueue.user.username})开始充电，详单号: ${recordNumber}`);

        // 通知下一个用户开始充电
        const io = req.app.get('io');
        if (io) {
          io.to(`user_${nextInQueue.userId}`).emit('chargingStart', {
            queueNumber: nextInQueue.queueNumber,
            chargingPile: queueRecord.chargingPile?.name,
            recordNumber,
            message: '您的充电已开始'
          });
          console.log('已通知下一个用户开始充电');
        } else {
          console.log('io实例未找到，无法发送WebSocket通知');
        }
      }
    }

    // 通知用户充电请求已取消
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('queueUpdate', {
        type: 'cancelled',
        queueNumber: queueRecord.queueNumber,
        message: '充电请求已取消'
      });
      console.log('已通知用户充电请求已取消');
    } else {
      console.log('io实例未找到，无法发送取消通知');
    }

    console.log('取消充电请求处理完成');
    res.json({
      success: true,
      message: '充电请求已取消'
    });

  } catch (error) {
    console.error('取消充电请求错误:', error);
    res.status(500).json({
      success: false,
      message: '取消请求失败',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// 获取充电桩状态
router.get('/piles', async (req: Request, res: Response) => {
  try {
    const chargingPiles = await prisma.chargingPile.findMany({
      include: {
        _count: {
          select: {
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
      orderBy: {
        position: 'asc'
      }
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
        queueCount: pile._count.queueRecords
      }))
    });

  } catch (error) {
    console.error('获取充电桩状态错误:', error);
    res.status(500).json({
      success: false,
      message: '获取充电桩状态失败'
    });
  }
});

// 辅助函数：生成排队号码
async function generateQueueNumber(chargingMode: 'FAST' | 'SLOW'): Promise<string> {
  const prefix = chargingMode === 'FAST' ? 'F' : 'T';
  
  // 最多尝试10次生成唯一的排队号码
  for (let attempt = 1; attempt <= 10; attempt++) {
    // 获取今天已生成的同类型排队号码数量
    const count = await prisma.queueRecord.count({
      where: {
        queueNumber: {
          startsWith: prefix
        },
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const queueNumber = `${prefix}${count + attempt}`;
    
    // 检查这个号码是否已存在
    const existing = await prisma.queueRecord.findUnique({
      where: { queueNumber }
    });
    
    if (!existing) {
      return queueNumber;
    }
  }
  
  // 如果10次都失败了，使用时间戳作为后缀
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}${timestamp}`;
}

// 辅助函数：获取队列位置
async function getQueuePosition(chargingMode: 'FAST' | 'SLOW'): Promise<number> {
  const count = await prisma.queueRecord.count({
    where: {
      chargingMode: chargingMode as any,
      status: {
        in: ['WAITING', 'IN_QUEUE']
      }
    }
  });

  return count + 1;
}

// 辅助函数：获取当前队列位置
async function getCurrentQueuePosition(queueNumber: string, chargingMode: 'FAST' | 'SLOW'): Promise<number> {
  const record = await prisma.queueRecord.findUnique({
    where: { queueNumber }
  });

  if (!record) return 0;

  const position = await prisma.queueRecord.count({
    where: {
      chargingMode: chargingMode as any,
      status: {
        in: ['WAITING', 'IN_QUEUE']
      },
      createdAt: {
        lt: record.createdAt
      }
    }
  });

  return position + 1;
}

// 辅助函数：计算预计等待时间
function calculateEstimatedWaitTime(chargingMode: 'FAST' | 'SLOW', position: number): string {
  // 假设快充平均30分钟，慢充平均1.5小时
  const avgTimePerSession = chargingMode === 'FAST' ? 30 : 90; // 分钟
  const estimatedMinutes = (position - 1) * avgTimePerSession;
  
  if (estimatedMinutes < 60) {
    return `${estimatedMinutes}分钟`;
  } else {
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  }
}

// 辅助函数：生成充电详单编号
async function generateRecordNumber(): Promise<string> {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const count = await prisma.chargingRecord.count({
    where: {
      recordNumber: {
        startsWith: `CR${today}`
      }
    }
  });
  
  return `CR${today}${(count + 1).toString().padStart(4, '0')}`;
}

export default router;