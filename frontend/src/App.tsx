import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';

// 页面组件
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChargingQueue from './pages/ChargingQueue';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<UserLogin />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route 
              path="/user/*" 
              element={
                <ProtectedRoute requiredRole="USER">
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/queue" element={<ChargingQueue />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;