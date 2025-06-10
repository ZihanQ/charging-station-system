"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// 获取用户信息
router.get('/profile', async (req, res) => {
    res.json({ success: true, message: '用户信息路由' });
});
// 获取充电记录
router.get('/records', async (req, res) => {
    res.json({ success: true, message: '充电记录路由' });
});
exports.default = router;
