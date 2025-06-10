"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
class SocketService {
    constructor(io) {
        this.io = io;
        this.setupSocketHandlers();
    }
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('用户连接:', socket.id);
            socket.on('disconnect', () => {
                console.log('用户断开连接:', socket.id);
            });
            // 用户加入房间
            socket.on('join-room', (room) => {
                socket.join(room);
                console.log(`用户 ${socket.id} 加入房间: ${room}`);
            });
        });
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
