import { Server, Socket } from 'socket.io';

export class SocketService {
  private io: Server;
  private userConnections: Map<string, Socket> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`用户连接: ${socket.id}`);

      // 用户登录时绑定用户ID
      socket.on('user_login', (userId: string) => {
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
  public notifyUser(userId: string, notification: any) {
    try {
      // 通过房间发送消息
      this.io.to(`user_${userId}`).emit('notification', notification);
      
      // 同时通过直接连接发送（备用方案）
      const userSocket = this.userConnections.get(userId);
      if (userSocket) {
        userSocket.emit('notification', notification);
      }
      
      console.log(`已向用户 ${userId} 发送通知:`, notification.type);
    } catch (error) {
      console.error(`发送用户通知失败 - 用户ID: ${userId}`, error);
    }
  }

  // 通知所有管理员
  public notifyAdmins(notification: any) {
    try {
      this.io.to('admin').emit('admin_notification', notification);
      console.log('已向所有管理员发送通知:', notification.type);
    } catch (error) {
      console.error('发送管理员通知失败:', error);
    }
  }

  // 广播系统消息
  public broadcastSystemMessage(message: any) {
    try {
      this.io.emit('system_message', message);
      console.log('已广播系统消息:', message.type);
    } catch (error) {
      console.error('广播系统消息失败:', error);
    }
  }

  // 获取在线用户数量
  public getOnlineUsersCount(): number {
    return this.userConnections.size;
  }

  // 获取在线用户列表
  public getOnlineUserIds(): string[] {
    return Array.from(this.userConnections.keys());
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