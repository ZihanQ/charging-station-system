"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// 应用认证和管理员权限中间件
router.use(auth_1.authenticateToken);
router.use(auth_1.requireAdmin);
// 获取系统概览
router.get('/dashboard', async (req, res) => {
    try {
        // 获取统计数据
        const [totalUsers, totalChargingPiles, todayRecords, currentQueue, revenue] = await Promise.all([
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
            })
        ]);
        // 获取充电桩状态统计
        const pileStatusStats = await prisma.chargingPile.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });
        // 获取充电记录状态统计
        const recordStatusStats = await prisma.chargingRecord.groupBy({
            by: ['status'],
            _count: {
                status: true
            },
            where: {
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        });
        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalChargingPiles,
                    todayRecords,
                    currentQueue,
                    todayRevenue: revenue._sum.totalFee || 0
                },
                pileStatusStats: pileStatusStats.reduce((acc, item) => {
                    acc[item.status] = item._count.status;
                    return acc;
                }, {}),
                recordStatusStats: recordStatusStats.reduce((acc, item) => {
                    acc[item.status] = item._count.status;
                    return acc;
                }, {})
            }
        });
    }
    catch (error) {
        console.error('获取管理员仪表板数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取数据失败'
        });
    }
});
// 获取所有用户列表
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
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
    }
    catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败'
        });
    }
});
// 获取充电桩列表
router.get('/piles', async (req, res) => {
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
    }
    catch (error) {
        console.error('获取充电桩列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取充电桩列表失败'
        });
    }
});
// 更新充电桩状态
router.patch('/piles/:pileId/status', async (req, res) => {
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
    }
    catch (error) {
        console.error('更新充电桩状态错误:', error);
        res.status(500).json({
            success: false,
            message: '更新充电桩状态失败'
        });
    }
});
// 获取排队管理数据
router.get('/queue', async (req, res) => {
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
        // 按充电模式分组
        const groupedQueue = queueRecords.reduce((acc, record) => {
            const mode = record.chargingMode;
            if (!acc[mode]) {
                acc[mode] = [];
            }
            acc[mode].push({
                id: record.id,
                queueNumber: record.queueNumber,
                user: record.user,
                batteryCapacity: record.batteryCapacity,
                requestedAmount: record.requestedAmount,
                position: record.position,
                status: record.status,
                chargingPile: record.chargingPile,
                waitingTime: record.waitingTime,
                createdAt: record.createdAt
            });
            return acc;
        }, {});
        res.json({
            success: true,
            data: {
                fastQueue: groupedQueue.FAST || [],
                slowQueue: groupedQueue.SLOW || [],
                totalWaiting: queueRecords.length
            }
        });
    }
    catch (error) {
        console.error('获取排队管理数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取排队数据失败'
        });
    }
});
// 手动分配充电桩
router.post('/queue/:queueId/assign', async (req, res) => {
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
    }
    catch (error) {
        console.error('分配充电桩错误:', error);
        res.status(500).json({
            success: false,
            message: '分配充电桩失败'
        });
    }
});
// 获取充电记录
router.get('/records', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const whereCondition = {};
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
    }
    catch (error) {
        console.error('获取充电记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取充电记录失败'
        });
    }
});
// 获取系统统计数据
router.get('/statistics', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        // 获取日度统计数据
        const dailyStats = await prisma.chargingRecord.groupBy({
            by: ['startTime'],
            _count: {
                id: true
            },
            _sum: {
                totalFee: true,
                actualAmount: true
            },
            where: {
                createdAt: {
                    gte: startDate
                },
                status: 'COMPLETED'
            }
        });
        // 获取充电模式统计
        const modeStats = await prisma.queueRecord.groupBy({
            by: ['chargingMode'],
            _count: {
                id: true
            },
            where: {
                createdAt: {
                    gte: startDate
                }
            }
        });
        res.json({
            success: true,
            data: {
                dailyStats,
                modeStats: modeStats.reduce((acc, item) => {
                    acc[item.chargingMode] = item._count.id;
                    return acc;
                }, {})
            }
        });
    }
    catch (error) {
        console.error('获取统计数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取统计数据失败'
        });
    }
});
exports.default = router;
