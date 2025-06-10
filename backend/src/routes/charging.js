"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// 提交充电请求
router.post('/request', async (req, res) => {
    res.json({ success: true, message: '充电请求路由' });
});
// 获取排队状态
router.get('/queue', async (req, res) => {
    res.json({ success: true, message: '排队状态路由' });
});
exports.default = router;
