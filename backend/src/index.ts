import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// 导入路由
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import chargingRoutes from './routes/charging';
import virtualTimeRoutes from './routes/virtualTime';
import testScriptRoutes from './routes/testScript';
import testUsersRoutes from './routes/testUsers';


// 导入服务
import { SocketService } from './services/socketService';
import { ChargingSystemService } from './services/chargingSystemService';
import { testScriptService } from './services/testScriptService';

// 加载环境变量
dotenv.config();

const app = express();
const server = createServer(app);

// Socket.IO配置
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/charging', chargingRoutes);
app.use('/api/virtual-time', virtualTimeRoutes);
app.use('/api/test-script', testScriptRoutes);
app.use('/api/test-users', testUsersRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 初始化服务
const socketService = new SocketService(io);

// 初始化充电路由服务
import { initializeServices as initializeChargingServices } from './routes/charging';
initializeChargingServices(socketService);

// 将io实例添加到app中，供路由使用
app.set('io', io);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message 
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: '路由不存在' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📡 Socket.IO 服务已启动`);
  
  // 初始化充电系统
  console.log('⚡ 充电调度系统已初始化');
  
  // 创建默认测试场景
  testScriptService.createDefaultTestScenarios();
  console.log('🧪 测试脚本服务已启动');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

export default app; 