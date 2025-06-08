import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 获取用户信息
router.get('/profile', async (req: Request, res: Response) => {
  res.json({ success: true, message: '用户信息路由' });
});

// 获取充电记录
router.get('/records', async (req: Request, res: Response) => {
  res.json({ success: true, message: '充电记录路由' });
});

export default router; 