"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const joi_1 = __importDefault(require("joi"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// 验证模式
const chargingRequestSchema = joi_1.default.object({
    batteryCapacity: joi_1.default.number().min(10).max(100).required(),
    requestedAmount: joi_1.default.number().min(1).max(100).required(),
    chargingMode: joi_1.default.string().valid('FAST', 'SLOW').required()
});
// 应用认证中间件到所有路由
router.use(auth_1.authenticateToken);
// 提交充电请求
router.post('/request', async (req, res) => {
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
        const userId = req.user.id;
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
        
        // 使用事务确保队列号生成和记录创建的原子性
        const queueRecord = await prisma.$transaction(async (tx) => {
            // 生成排队号码 - 使用重试机制处理并发
            const prefix = chargingMode === 'FAST' ? 'F' : 'T';
            let queueNumber;
            let attempts = 0;
            const maxAttempts = 10;
            
            while (attempts < maxAttempts) {
                // 查找当天该类型的所有队列号
                const todayRecords = await tx.queueRecord.findMany({
                    where: {
                        queueNumber: {
                            startsWith: prefix
                        },
                        createdAt: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    },
                    select: {
                        queueNumber: true
                    }
                });
                
                // 找到最大的数字部分
                let maxNumber = 0;
                const usedNumbers = new Set();
                
                for (const record of todayRecords) {
                    const numberPart = parseInt(record.queueNumber.substring(1)) || 0;
                    usedNumbers.add(numberPart);
                    if (numberPart > maxNumber) {
                        maxNumber = numberPart;
                    }
                }
                
                // 寻找第一个未使用的数字（从1开始）
                let nextNumber = 1;
                while (usedNumbers.has(nextNumber)) {
                    nextNumber++;
                }
                
                queueNumber = `${prefix}${nextNumber}`;
                
                // 检查这个号码是否真的不存在（双重检查）
                const existing = await tx.queueRecord.findUnique({
                    where: {
                        queueNumber: queueNumber
                    }
                });
                
                if (!existing) {
                    break; // 找到了可用的号码
                }
                
                attempts++;
                
                // 如果多次尝试仍然冲突，添加时间戳
                if (attempts === maxAttempts) {
                    const timestamp = Date.now().toString().slice(-4);
                    queueNumber = `${prefix}${maxNumber + 1}_${timestamp}`;
                }
            }
            
            // 获取队列位置
            const position = await getQueuePosition(chargingMode);
            
            // 创建排队记录
            return await tx.queueRecord.create({
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
        });
        res.status(201).json({
            success: true,
            message: '充电请求已提交',
            data: {
                queueNumber: queueRecord.queueNumber,
                position: queueRecord.position,
                estimatedTime: calculateEstimatedWaitTime(chargingMode, queueRecord.position),
                status: queueRecord.status
            }
        });
    }
    catch (error) {
        console.error('提交充电请求错误:', error);
        res.status(500).json({
            success: false,
            message: '提交失败，请稍后重试'
        });
    }
});
// 获取排队状态
router.get('/queue', async (req, res) => {
    try {
        const userId = req.user.id;
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
        const currentPosition = await getCurrentQueuePosition(queueRecord.queueNumber, queueRecord.chargingMode);
        res.json({
            success: true,
            data: {
                queueNumber: queueRecord.queueNumber,
                position: currentPosition,
                estimatedTime: calculateEstimatedWaitTime(queueRecord.chargingMode, currentPosition),
                status: queueRecord.status,
                chargingMode: queueRecord.chargingMode,
                requestedAmount: queueRecord.requestedAmount,
                chargingPile: queueRecord.chargingPile,
                createdAt: queueRecord.createdAt
            }
        });
    }
    catch (error) {
        console.error('获取排队状态错误:', error);
        res.status(500).json({
            success: false,
            message: '获取排队状态失败'
        });
    }
});
// 获取充电记录
router.get('/records', async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
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
    }
    catch (error) {
        console.error('获取充电记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取充电记录失败'
        });
    }
});
// 取消充电请求
router.delete('/request/:queueNumber', async (req, res) => {
    try {
        const { queueNumber } = req.params;
        const userId = req.user.id;
        // 查找排队记录
        const queueRecord = await prisma.queueRecord.findFirst({
            where: {
                queueNumber,
                userId,
                status: {
                    in: ['WAITING', 'IN_QUEUE']
                }
            }
        });
        if (!queueRecord) {
            return res.status(404).json({
                success: false,
                message: '未找到可取消的充电请求'
            });
        }
        // 更新状态为已取消
        await prisma.queueRecord.update({
            where: { id: queueRecord.id },
            data: { status: 'CANCELLED' }
        });
        res.json({
            success: true,
            message: '充电请求已取消'
        });
    }
    catch (error) {
        console.error('取消充电请求错误:', error);
        res.status(500).json({
            success: false,
            message: '取消请求失败'
        });
    }
});
// 获取充电桩状态
router.get('/piles', async (req, res) => {
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
    }
    catch (error) {
        console.error('获取充电桩状态错误:', error);
        res.status(500).json({
            success: false,
            message: '获取充电桩状态失败'
        });
    }
});
// 辅助函数：获取队列位置
async function getQueuePosition(chargingMode) {
    const count = await prisma.queueRecord.count({
        where: {
            chargingMode: chargingMode,
            status: {
                in: ['WAITING', 'IN_QUEUE']
            }
        }
    });
    return count + 1;
}
// 辅助函数：获取当前队列位置
async function getCurrentQueuePosition(queueNumber, chargingMode) {
    const record = await prisma.queueRecord.findUnique({
        where: { queueNumber }
    });
    if (!record)
        return 0;
    const position = await prisma.queueRecord.count({
        where: {
            chargingMode: chargingMode,
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
function calculateEstimatedWaitTime(chargingMode, position) {
    // 假设快充平均30分钟，慢充平均1.5小时
    const avgTimePerSession = chargingMode === 'FAST' ? 30 : 90; // 分钟
    const estimatedMinutes = (position - 1) * avgTimePerSession;
    if (estimatedMinutes < 60) {
        return `${estimatedMinutes}分钟`;
    }
    else {
        const hours = Math.floor(estimatedMinutes / 60);
        const minutes = estimatedMinutes % 60;
        return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
    }
}
exports.default = router;
