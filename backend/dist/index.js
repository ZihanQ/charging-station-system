"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
// 导入路由
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const admin_1 = __importDefault(require("./routes/admin"));
const charging_1 = __importDefault(require("./routes/charging"));
// 导入服务
const socketService_1 = require("./services/socketService");
const chargingSystemService_1 = require("./services/chargingSystemService");
// 加载环境变量
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Socket.IO配置
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
// 中间件
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 路由
app.use('/api/auth', auth_1.default);
app.use('/api/user', user_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/charging', charging_1.default);
// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// 初始化服务
const socketService = new socketService_1.SocketService(io);
const chargingSystemService = new chargingSystemService_1.ChargingSystemService(socketService);
// 将io实例添加到app中，供路由使用
app.set('io', io);
// 错误处理中间件
app.use((err, req, res, next) => {
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
    chargingSystemService.initialize().then(() => {
        console.log('⚡ 充电调度系统已初始化');
    }).catch(console.error);
});
// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
exports.default = app;
