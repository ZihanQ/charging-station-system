import { io, Socket } from 'socket.io-client';
import { message } from 'antd';

export class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(userId?: string, userRole?: string) {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:3000', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket 已连接');
      this.isConnected = true;

      // 根据用户角色加入相应房间
      if (userId && userRole) {
        if (userRole === 'ADMIN') {
          this.socket?.emit('join_admin');
        } else {
          this.socket?.emit('user_login', userId);
        }
      }
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket 连接断开');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket 连接错误:', error);
      this.isConnected = false;
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // 用户通知
    this.socket.on('notification', (data) => {
      console.log('收到用户通知:', data);
      if (data.type === 'QUEUE_UPDATE') {
        // 触发队列状态更新
        window.dispatchEvent(new CustomEvent('queueUpdate', { detail: data.data }));
      } else if (data.type === 'CHARGING_START') {
        message.success(`您的充电已开始！充电桩：${data.data.pileName || data.data.chargingPile}`);
        window.dispatchEvent(new CustomEvent('chargingStart', { detail: data.data }));
      } else if (data.type === 'CHARGING_COMPLETE') {
        message.success(`充电已完成！总费用：¥${data.data.totalFee}`);
        window.dispatchEvent(new CustomEvent('chargingComplete', { detail: data.data }));
      }
    });

    // 管理员通知
    this.socket.on('admin_notification', (data) => {
      console.log('收到管理员通知:', data);
      if (data.type === 'NEW_QUEUE_REQUEST') {
        message.info(`新的充电请求：用户 ${data.data.username}`);
        window.dispatchEvent(new CustomEvent('newQueueRequest', { detail: data.data }));
      } else if (data.type === 'PILE_STATUS_CHANGE') {
        window.dispatchEvent(new CustomEvent('pileStatusUpdate', { detail: data.data }));
      } else if (data.type === 'QUEUE_UPDATE') {
        window.dispatchEvent(new CustomEvent('queueUpdate', { detail: data.data }));
      }
    });

    // 队列更新 - 通用事件
    this.socket.on('queue-update', (data) => {
      console.log('队列状态更新:', data);
      window.dispatchEvent(new CustomEvent('queueUpdate', { detail: data }));
    });

    // 充电桩状态更新
    this.socket.on('pile-status-update', (data) => {
      console.log('充电桩状态更新:', data);
      window.dispatchEvent(new CustomEvent('pileStatusUpdate', { detail: data }));
    });

    // 系统消息
    this.socket.on('system_message', (data) => {
      console.log('系统消息:', data);
      if (data.type === 'MAINTENANCE') {
        message.warning(`系统维护通知：${data.message}`);
      }
    });

    // 添加更多通用事件监听
    this.socket.on('charging_request_submitted', (data) => {
      console.log('充电请求已提交:', data);
      window.dispatchEvent(new CustomEvent('newQueueRequest', { detail: data }));
    });

    this.socket.on('charging_status_change', (data) => {
      console.log('充电状态变更:', data);
      window.dispatchEvent(new CustomEvent('queueUpdate', { detail: data }));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // 发送消息（如果需要）
  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}

// 导出单例实例
export const webSocketService = new WebSocketService(); 