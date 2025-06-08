import { Server } from 'socket.io';

export class SocketService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('用户连接:', socket.id);

      socket.on('disconnect', () => {
        console.log('用户断开连接:', socket.id);
      });

      // 用户加入房间
      socket.on('join-room', (room: string) => {
        socket.join(room);
        console.log(`用户 ${socket.id} 加入房间: ${room}`);
      });
    });
  }

  // 广播排队状态更新
  public broadcastQueueUpdate(data: any) {
    this.io.emit('queue-update', data);
  }

  // 广播充电桩状态更新
  public broadcastPileStatusUpdate(data: any) {
    this.io.emit('pile-status-update', data);
  }

  // 发送给特定用户
  public sendToUser(userId: string, event: string, data: any) {
    this.io.emit(`user-${userId}`, { event, data });
  }
} 