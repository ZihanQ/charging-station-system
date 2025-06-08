import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { LockOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onLogin = async (values: any) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/admin/login', values);
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        message.success('管理员登录成功');
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 flex items-center justify-center p-4">
      <Card 
        className="w-full max-w-md shadow-2xl border-0 rounded-2xl"
        bodyStyle={{ padding: '2rem' }}
      >
        <div className="text-center mb-8">
          <div className="mb-4">
            <SettingOutlined className="text-6xl text-purple-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            管理员登录
          </h1>
          <p className="text-gray-600">充电桩系统管理中心</p>
        </div>

        <Form
          name="adminLogin"
          onFinish={onLogin}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="管理员邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入管理员邮箱' },
              { type: 'email', message: '请输入有效邮箱' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="请输入管理员邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="管理员密码"
            name="password"
            rules={[{ required: true, message: '请输入管理员密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入管理员密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              className="w-full h-12 text-lg font-medium bg-purple-500 hover:bg-purple-600 border-purple-500 hover:border-purple-600"
            >
              登录管理系统
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-6">
          <Button 
            type="link" 
            onClick={() => navigate('/')}
            className="text-purple-500 hover:text-purple-600"
          >
            ← 返回用户登录
          </Button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">测试账号</h3>
          <p className="text-xs text-gray-600">
            邮箱: admin@charging.com<br />
            密码: admin123
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin; 