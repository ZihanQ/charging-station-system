import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 获取充电桩状态
router.get('/piles/status', async (req: Request, res: Response) => {
  res.json({ success: true, message: '充电桩状态路由' });
});

// 获取报表数据
router.get('/reports', async (req: Request, res: Response) => {
  res.json({ success: true, message: '报表数据路由' });
});

export default router; 