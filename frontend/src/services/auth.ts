export interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthData {
  user: User;
  token: string;
}

class AuthService {
  // 根据角色使用不同的存储键
  private getStorageKey(type: 'token' | 'user', role: 'USER' | 'ADMIN' = 'USER') {
    const prefix = role === 'ADMIN' ? 'admin_' : 'user_';
    return `${prefix}${type}`;
  }

  // 保存认证数据
  saveAuthData(authData: AuthData) {
    const { user, token } = authData;
    const tokenKey = this.getStorageKey('token', user.role);
    const userKey = this.getStorageKey('user', user.role);
    
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(userKey, JSON.stringify(user));
  }

  // 获取当前用户
  getCurrentUser(role: 'USER' | 'ADMIN' = 'USER'): User | null {
    try {
      const userKey = this.getStorageKey('user', role);
      const userStr = localStorage.getItem(userKey);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  // 获取令牌
  getToken(role: 'USER' | 'ADMIN' = 'USER'): string | null {
    const tokenKey = this.getStorageKey('token', role);
    return localStorage.getItem(tokenKey);
  }

  // 检查是否已登录
  isAuthenticated(role: 'USER' | 'ADMIN' = 'USER'): boolean {
    const token = this.getToken(role);
    const user = this.getCurrentUser(role);
    return !!token && !!user && user.role === role;
  }

  // 退出登录
  logout(role: 'USER' | 'ADMIN' = 'USER') {
    const tokenKey = this.getStorageKey('token', role);
    const userKey = this.getStorageKey('user', role);
    
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
  }

  // 清除所有认证数据（用于完全重置）
  clearAll() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_user');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    // 兼容旧版本
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // 迁移旧的存储格式
  migrateOldStorage() {
    const oldToken = localStorage.getItem('token');
    const oldUser = localStorage.getItem('user');
    
    if (oldToken && oldUser) {
      try {
        const user = JSON.parse(oldUser);
        
        // 迁移到新格式
        this.saveAuthData({ user, token: oldToken });
        
        // 清除旧格式
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        console.log('已迁移认证数据到新格式');
      } catch (error) {
        console.error('迁移认证数据失败:', error);
      }
    }
  }
}

export const authService = new AuthService(); 