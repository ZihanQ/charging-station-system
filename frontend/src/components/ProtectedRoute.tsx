import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'ADMIN';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'USER' }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user');

      if (!token || !userString) {
        // 没有token或用户信息，重定向到登录页
        if (requiredRole === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
        return;
      }

      try {
        const user = JSON.parse(userString);
        
        // 检查用户角色
        if (requiredRole && user.role !== requiredRole) {
          if (requiredRole === 'ADMIN') {
            navigate('/admin');
          } else {
            navigate('/');
          }
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('解析用户信息失败:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (requiredRole === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    };

    checkAuth();
  }, [navigate, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute; 