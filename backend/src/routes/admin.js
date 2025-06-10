"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// 获取充电桩状态
router.get('/piles/status', async (req, res) => {
    res.json({ success: true, message: '充电桩状态路由' });
});
// 获取报表数据
router.get('/reports', async (req, res) => {
    res.json({ success: true, message: '报表数据路由' });
});
exports.default = router;
