import axios from 'axios';
import { authService } from './auth';

const API_BASE_URL = 'http://localhost:3000/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动添加token
apiClient.interceptors.request.use(
  (config) => {
    let token: string | null = null;
    
    // 根据请求路径智能选择token
    if (config.url?.includes('/admin/')) {
      // 管理员API请求，使用管理员token
      token = authService.getToken('ADMIN');
    } else {
      // 普通API请求，优先使用普通用户token，如果没有则使用管理员token
      token = authService.getToken('USER');
      if (!token) {
        token = authService.getToken('ADMIN');
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理401错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除认证数据并跳转到登录页
      authService.clearAll();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// API响应处理工具
export const apiUtils = {
  handleResponse: <T>(response: any): T => {
    if (response.data?.success) {
      return response.data.data;
    }
    throw new Error(response.data?.message || '请求失败');
  },
  
  handleError: (error: any): string => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return '网络错误，请稍后重试';
  }
};

// 认证相关API
export const authAPI = {
  login: (credentials: { email: string; password: string }) => 
    apiClient.post('/auth/login', credentials),
  
  adminLogin: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/admin/login', credentials),
  
  register: (userData: { username: string; email: string; password: string; phoneNumber?: string }) =>
    apiClient.post('/auth/register', userData),
};

// 用户相关API
export const userAPI = {
  getProfile: () => apiClient.get('/user/profile'),
  updateProfile: (data: any) => apiClient.put('/user/profile', data),
  getStatistics: () => apiClient.get('/user/statistics'),
};

// 充电相关API
export const chargingAPI = {
  submitRequest: (data: { batteryCapacity: number; requestedAmount: number; chargingMode: string }) =>
    apiClient.post('/charging/request', data),
  
  getQueueStatus: () => apiClient.get('/charging/queue'),
  
  cancelRequest: (queueNumber: string) => 
    apiClient.delete(`/charging/request/${queueNumber}`),
  
  getRecords: (page: number = 1, limit: number = 10) =>
    apiClient.get(`/charging/records?page=${page}&limit=${limit}`),
};

// 管理员相关API
export const adminAPI = {
  getDashboard: () => apiClient.get('/admin/dashboard'),
  
  getPiles: () => apiClient.get('/admin/piles'),
  
  updatePileStatus: (pileId: string, status: string) =>
    apiClient.patch(`/admin/piles/${pileId}/status`, { status }),
  
  getQueueManagement: () => apiClient.get('/admin/queue'),
  
  assignPile: (queueId: string, pileId: string) =>
    apiClient.post(`/admin/queue/${queueId}/assign`, { chargingPileId: pileId }),
  
  getStatistics: () => apiClient.get('/admin/statistics'),
  
  getUsers: () => apiClient.get('/admin/users'),
  
  updateUserStatus: (userId: string, status: string) =>
    apiClient.put(`/admin/users/${userId}/status`, { status }),
};

export default apiClient; 