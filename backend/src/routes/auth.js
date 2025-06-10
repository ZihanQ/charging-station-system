"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const joi_1 = __importDefault(require("joi"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// 用户注册验证模式
const registerSchema = joi_1.default.object({
    username: joi_1.default.string().alphanum().min(3).max(30).required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    phoneNumber: joi_1.default.string().optional()
});
// 登录验证模式
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required()
});
// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: '输入数据验证失败',
                details: error.details[0].message
            });
        }
        const { username, email, password, phoneNumber } = value;
        // 检查用户是否已存在
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: '用户名或邮箱已存在'
            });
        }
        // 加密密码
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // 创建用户
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                phoneNumber,
                role: 'USER'
            },
            select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
                role: true,
                createdAt: true
            }
        });
        res.status(201).json({
            success: true,
            message: '注册成功',
            data: user
        });
    }
    catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试'
        });
    }
});
// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: '输入数据验证失败',
                details: error.details[0].message
            });
        }
        const { email, password } = value;
        // 查找用户
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }
        // 验证密码
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }
        // 生成JWT令牌
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role
                }
            }
        });
    }
    catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试'
        });
    }
});
// 管理员登录
router.post('/admin/login', async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: '输入数据验证失败',
                details: error.details[0].message
            });
        }
        const { email, password } = value;
        // 查找管理员用户
        const user = await prisma.user.findFirst({
            where: {
                email,
                role: 'ADMIN'
            }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '管理员账号或密码错误'
            });
        }
        // 验证密码
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '管理员账号或密码错误'
            });
        }
        // 生成JWT令牌
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
        res.json({
            success: true,
            message: '管理员登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role
                }
            }
        });
    }
    catch (error) {
        console.error('管理员登录错误:', error);
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试'
        });
    }
});
exports.default = router;
