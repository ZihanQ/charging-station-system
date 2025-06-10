import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Alert } from 'antd';
import { LockOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI, apiUtils } from '../services/api';

interface AdminLoginForm {
  email: string;
  password: string;
}

const AdminLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  const onLogin = async (values: AdminLoginForm) => {
    setLoading(true);
    setLoginError('');
    
    try {
      const response = await authAPI.adminLogin(values);
      const data = apiUtils.handleResponse<{
        token: string;
        user: {
          id: string;
          username: string;
          email: string;
          phoneNumber?: string;
          role: string;
        };
      }>(response);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      message.success('管理员登录成功！');
      navigate('/admin/dashboard');
    } catch (error: any) {
      const errorMessage = apiUtils.handleError(error);
      setLoginError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 顶部标识 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <SettingOutlined className="text-3xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            管理员登录
          </h1>
          <p className="text-gray-600">充电桩系统管理中心</p>
        </div>

        <Card 
          className="shadow-2xl border-0 rounded-2xl backdrop-blur-sm bg-white/95"
          bodyStyle={{ padding: '2rem' }}
        >
          {loginError && (
            <Alert
              message={loginError}
              type="error"
              showIcon
              className="mb-6"
              closable
              onClose={() => setLoginError('')}
            />
          )}

          <Form
            name="adminLogin"
            onFinish={onLogin}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              label="管理员邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入管理员邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input 
                prefix={<MailOutlined className="text-gray-400" />} 
                placeholder="请输入管理员邮箱"
                className="rounded-lg h-12"
              />
            </Form.Item>

            <Form.Item
              label="管理员密码"
              name="password"
              rules={[{ required: true, message: '请输入管理员密码' }]}
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400" />} 
                placeholder="请输入管理员密码"
                className="rounded-lg h-12"
              />
            </Form.Item>

            <Form.Item className="mb-6">
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                className="w-full h-12 text-lg font-medium rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 border-0 hover:from-purple-600 hover:to-indigo-700 shadow-lg"
              >
                {loading ? '登录中...' : '登录管理系统'}
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center pt-4 border-t border-gray-100">
            <Button 
              type="link" 
              onClick={() => navigate('/')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              ← 返回用户登录
            </Button>
          </div>
        </Card>

        {/* 测试账号信息 */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
          <h3 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
            <SettingOutlined className="mr-2" />
            测试账号信息
          </h3>
          <div className="text-sm text-purple-700 space-y-1">
            <p><span className="font-medium">邮箱:</span> admin@charging.com</p>
            <p><span className="font-medium">密码:</span> admin123</p>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>© 2024 智能充电桩系统 - 管理中心</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 