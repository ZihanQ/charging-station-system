import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// 认证相关 API
export const authAPI = {
  // 用户注册
  register: (data: {
    username: string;
    email: string;
    password: string;
    phoneNumber?: string;
  }) => api.post('/auth/register', data),

  // 用户登录
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  // 管理员登录
  adminLogin: (data: { email: string; password: string }) =>
    api.post('/auth/admin/login', data),
};

// 用户相关 API
export const userAPI = {
  // 获取用户信息
  getProfile: () => api.get('/user/profile'),

  // 更新用户信息
  updateProfile: (data: { username?: string; phoneNumber?: string }) =>
    api.patch('/user/profile', data),

  // 修改密码
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/user/password', data),

  // 获取用户统计数据
  getStatistics: () => api.get('/user/statistics'),

  // 获取最近充电记录
  getRecentRecords: (limit: number = 5) =>
    api.get(`/user/recent-records?limit=${limit}`),
};

// 充电相关 API
export const chargingAPI = {
  // 提交充电请求
  submitRequest: (data: {
    batteryCapacity: number;
    requestedAmount: number;
    chargingMode: 'FAST' | 'SLOW';
  }) => api.post('/charging/request', data),

  // 获取排队状态
  getQueueStatus: () => api.get('/charging/queue'),

  // 获取充电记录
  getRecords: (page: number = 1, limit: number = 10) =>
    api.get(`/charging/records?page=${page}&limit=${limit}`),

  // 取消充电请求
  cancelRequest: (queueNumber: string) =>
    api.delete(`/charging/request/${queueNumber}`),

  // 获取充电桩状态
  getPileStatus: () => api.get('/charging/piles'),
};

// 管理员相关 API
export const adminAPI = {
  // 获取管理员仪表板数据
  getDashboard: () => api.get('/admin/dashboard'),

  // 获取用户列表
  getUsers: (page: number = 1, limit: number = 10) =>
    api.get(`/admin/users?page=${page}&limit=${limit}`),

  // 获取充电桩列表
  getPiles: () => api.get('/admin/piles'),

  // 更新充电桩状态
  updatePileStatus: (pileId: string, status: string) =>
    api.patch(`/admin/piles/${pileId}/status`, { status }),

  // 获取排队管理数据
  getQueueManagement: () => api.get('/admin/queue'),

  // 手动分配充电桩
  assignPile: (queueId: string, chargingPileId: string) =>
    api.post(`/admin/queue/${queueId}/assign`, { chargingPileId }),

  // 获取充电记录
  getRecords: (page: number = 1, limit: number = 10, status?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status && status !== 'ALL') {
      params.append('status', status);
    }
    return api.get(`/admin/records?${params.toString()}`);
  },

  // 获取统计数据
  getStatistics: (days: number = 7) =>
    api.get(`/admin/statistics?days=${days}`),
};

// 通用工具函数
export const apiUtils = {
  // 处理 API 响应
  handleResponse: <T>(response: any): T => {
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || '操作失败');
  },

  // 处理 API 错误
  handleError: (error: any): string => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return '网络错误，请稍后重试';
  },
};

export default api; 