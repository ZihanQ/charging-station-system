"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const joi_1 = __importDefault(require("joi"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// 应用认证中间件到所有路由
router.use(auth_1.authenticateToken);
// 验证模式
const updateProfileSchema = joi_1.default.object({
    username: joi_1.default.string().alphanum().min(3).max(30).optional(),
    phoneNumber: joi_1.default.string().optional().allow('', null)
});
const changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required(),
    newPassword: joi_1.default.string().min(6).required()
});
// 获取用户个人信息
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        chargingRecords: true,
                        queueRecords: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户信息失败'
        });
    }
});
// 更新用户个人信息
router.patch('/profile', async (req, res) => {
    try {
        const { error, value } = updateProfileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: '输入数据验证失败',
                details: error.details[0].message
            });
        }
        const userId = req.user.id;
        const { username, phoneNumber } = value;
        // 如果更新用户名，检查是否已存在
        if (username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username,
                    id: { not: userId }
                }
            });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: '用户名已存在'
                });
            }
        }
        // 更新用户信息
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(username && { username }),
                ...(phoneNumber !== undefined && { phoneNumber })
            },
            select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
                role: true,
                updatedAt: true
            }
        });
        res.json({
            success: true,
            message: '个人信息更新成功',
            data: updatedUser
        });
    }
    catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '更新个人信息失败'
        });
    }
});
// 修改密码
router.patch('/password', async (req, res) => {
    try {
        const { error, value } = changePasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: '输入数据验证失败',
                details: error.details[0].message
            });
        }
        const userId = req.user.id;
        const { currentPassword, newPassword } = value;
        // 获取用户当前密码
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        // 验证当前密码
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: '当前密码错误'
            });
        }
        // 加密新密码
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 12);
        // 更新密码
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });
        res.json({
            success: true,
            message: '密码修改成功'
        });
    }
    catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({
            success: false,
            message: '修改密码失败'
        });
    }
});
// 获取用户统计数据
router.get('/statistics', async (req, res) => {
    try {
        const userId = req.user.id;
        // 获取用户统计数据
        const [totalRecords, totalAmount, totalFee, currentQueueRecord] = await Promise.all([
            // 总充电次数
            prisma.chargingRecord.count({
                where: { userId, status: 'COMPLETED' }
            }),
            // 总充电量
            prisma.chargingRecord.aggregate({
                _sum: { actualAmount: true },
                where: { userId, status: 'COMPLETED' }
            }),
            // 总费用
            prisma.chargingRecord.aggregate({
                _sum: { totalFee: true },
                where: { userId, status: 'COMPLETED' }
            }),
            // 当前排队记录
            prisma.queueRecord.findFirst({
                where: {
                    userId,
                    status: { in: ['WAITING', 'IN_QUEUE', 'CHARGING'] }
                },
                include: {
                    chargingPile: {
                        select: { name: true, type: true }
                    }
                }
            })
        ]);
        // 获取本月统计
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        const [monthlyRecords, monthlyFee] = await Promise.all([
            prisma.chargingRecord.count({
                where: {
                    userId,
                    status: 'COMPLETED',
                    createdAt: { gte: thisMonth }
                }
            }),
            prisma.chargingRecord.aggregate({
                _sum: { totalFee: true },
                where: {
                    userId,
                    status: 'COMPLETED',
                    createdAt: { gte: thisMonth }
                }
            })
        ]);
        res.json({
            success: true,
            data: {
                total: {
                    records: totalRecords,
                    amount: totalAmount._sum.actualAmount || 0,
                    fee: totalFee._sum.totalFee || 0
                },
                monthly: {
                    records: monthlyRecords,
                    fee: monthlyFee._sum.totalFee || 0
                },
                currentQueue: currentQueueRecord ? {
                    queueNumber: currentQueueRecord.queueNumber,
                    status: currentQueueRecord.status,
                    chargingMode: currentQueueRecord.chargingMode,
                    chargingPile: currentQueueRecord.chargingPile
                } : null
            }
        });
    }
    catch (error) {
        console.error('获取用户统计数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取统计数据失败'
        });
    }
});
// 获取用户最近的充电记录
router.get('/recent-records', async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 5;
        const recentRecords = await prisma.chargingRecord.findMany({
            where: { userId },
            include: {
                chargingPile: {
                    select: {
                        name: true,
                        type: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        res.json({
            success: true,
            data: recentRecords.map(record => ({
                id: record.id,
                recordNumber: record.recordNumber,
                chargingPile: record.chargingPile.name,
                chargingPileType: record.chargingPile.type,
                actualAmount: record.actualAmount,
                totalFee: record.totalFee,
                status: record.status,
                startTime: record.startTime,
                endTime: record.endTime,
                createdAt: record.createdAt
            }))
        });
    }
    catch (error) {
        console.error('获取最近充电记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取最近充电记录失败'
        });
    }
});
exports.default = router;
