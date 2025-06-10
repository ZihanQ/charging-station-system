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
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '访问令牌不存在'
            });
        }
        // 验证令牌
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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
        if (!user) {
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
        next();
    }
    catch (error) {
        return res.status(403).json({
            success: false,
            message: '令牌无效'
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
