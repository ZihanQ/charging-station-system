import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'USER' | 'ADMIN';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  // 检查是否已认证且角色匹配
  const isAuthenticated = authService.isAuthenticated(requiredRole);
  
  if (!isAuthenticated) {
    // 未认证，重定向到相应的登录页面
    return <Navigate to={requiredRole === 'ADMIN' ? '/admin' : '/'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 