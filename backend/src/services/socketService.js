"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
class SocketService {
    constructor(io) {
        this.userConnections = new Map();
        this.io = io;
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`用户连接: ${socket.id}`);
            // 用户登录时绑定用户ID
            socket.on('user_login', (userId) => {
                this.userConnections.set(userId, socket);
                socket.join(`user_${userId}`);
                console.log(`用户 ${userId} 已连接`);
            });
            // 用户断开连接
            socket.on('disconnect', () => {
                console.log(`用户断开连接: ${socket.id}`);
                // 从用户连接映射中移除
                for (const [userId, userSocket] of this.userConnections.entries()) {
                    if (userSocket.id === socket.id) {
                        this.userConnections.delete(userId);
                        break;
                    }
                }
            });
            // 加入管理员房间
            socket.on('join_admin', () => {
                socket.join('admin');
                console.log(`管理员连接: ${socket.id}`);
            });
        });
    }
    // 通知特定用户
    notifyUser(userId, notification) {
        try {
            // 通过房间发送消息
            this.io.to(`user_${userId}`).emit('notification', notification);
            // 同时通过直接连接发送（备用方案）
            const userSocket = this.userConnections.get(userId);
            if (userSocket) {
                userSocket.emit('notification', notification);
            }
            console.log(`已向用户 ${userId} 发送通知:`, notification.type);
        }
        catch (error) {
            console.error(`发送用户通知失败 - 用户ID: ${userId}`, error);
        }
    }
    // 通知所有管理员
    notifyAdmins(notification) {
        try {
            this.io.to('admin').emit('admin_notification', notification);
            console.log('已向所有管理员发送通知:', notification.type);
        }
        catch (error) {
            console.error('发送管理员通知失败:', error);
        }
    }
    // 广播系统消息
    broadcastSystemMessage(message) {
        try {
            this.io.emit('system_message', message);
            console.log('已广播系统消息:', message.type);
        }
        catch (error) {
            console.error('广播系统消息失败:', error);
        }
    }
    // 获取在线用户数量
    getOnlineUsersCount() {
        return this.userConnections.size;
    }
    // 获取在线用户列表
    getOnlineUserIds() {
        return Array.from(this.userConnections.keys());
    }
    // 广播排队状态更新
    broadcastQueueUpdate(data) {
        this.io.emit('queue-update', data);
    }
    // 广播充电桩状态更新
    broadcastPileStatusUpdate(data) {
        this.io.emit('pile-status-update', data);
    }
    // 发送给特定用户
    sendToUser(userId, event, data) {
        this.io.emit(`user-${userId}`, { event, data });
    }
}
exports.SocketService = SocketService;
