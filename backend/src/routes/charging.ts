import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 提交充电请求
router.post('/request', async (req: Request, res: Response) => {
  res.json({ success: true, message: '充电请求路由' });
});

// 获取排队状态
router.get('/queue', async (req: Request, res: Response) => {
  res.json({ success: true, message: '排队状态路由' });
});

export default router; 