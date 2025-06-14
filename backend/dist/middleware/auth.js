"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// JWT认证中间件
const authenticateToken = async (req, res, next) => {
    try {
        console.log(`[AUTH] 收到请求: ${req.method} ${req.path}`);
        const authHeader = req.headers['authorization'];
        console.log(`[AUTH] Authorization header: ${authHeader}`);
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        console.log(`[AUTH] 提取的token: ${token ? token.substring(0, 20) + '...' : 'null'}`);
        if (!token) {
            console.log('[AUTH] Token不存在，返回401');
            return res.status(401).json({
                success: false,
                message: '访问令牌不存在'
            });
        }
        // 验证令牌
        console.log(`[AUTH] 开始验证token，JWT_SECRET存在: ${!!process.env.JWT_SECRET}`);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log(`[AUTH] Token解码成功，用户ID: ${decoded.userId}`);
        // 查询用户是否存在
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                username: true
            }
        });
        console.log(`[AUTH] 数据库查询用户结果: ${user ? `找到用户 ${user.username}` : '用户不存在'}`);
        if (!user) {
            console.log('[AUTH] 用户不存在，返回401');
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        console.log(`[AUTH] 认证成功，用户: ${user.username} (${user.role})`);
        next();
    }
    catch (error) {
        console.error('[AUTH] Token验证失败:', error);
        return res.status(403).json({
            success: false,
            message: '令牌无效',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.authenticateToken = authenticateToken;
// 管理员权限验证中间件
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: '需要管理员权限'
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;
