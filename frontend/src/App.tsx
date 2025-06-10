import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import './App.css';

// 页面组件
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="App">
          <Routes>
            {/* 公开路由 */}
            <Route path="/" element={<UserLogin />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/register" element={<Register />} />
            
            {/* 受保护的用户路由 */}
            <Route path="/user" element={
              <ProtectedRoute requiredRole="USER">
                <UserDashboard />
              </ProtectedRoute>
            } />
            
            {/* 受保护的管理员路由 */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* 重定向/dashboard到管理员仪表板 */}
            <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;