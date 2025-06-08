import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { TabPane } = Tabs;

const UserLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onLogin = async (values: any) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', values);
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        message.success('登录成功');
        navigate('/user');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: any) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', values);
      if (response.data.success) {
        message.success('注册成功，请登录');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      <Card 
        className="w-full max-w-md shadow-2xl border-0 rounded-2xl"
        bodyStyle={{ padding: '2rem' }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ⚡ 智能充电桩系统
          </h1>
          <p className="text-gray-600">欢迎使用充电调度服务</p>
        </div>

        <Tabs defaultActiveKey="login" centered>
          <TabPane tab="登录" key="login">
            <Form
              name="login"
              onFinish={onLogin}
              autoComplete="off"
              layout="vertical"
            >
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效邮箱' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="请输入邮箱"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  size="large"
                  className="w-full h-12 text-lg font-medium"
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane tab="注册" key="register">
            <Form
              name="register"
              onFinish={onRegister}
              autoComplete="off"
              layout="vertical"
            >
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3位' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="请输入用户名"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效邮箱' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="请输入邮箱"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="密码"
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="手机号"
                name="phoneNumber"
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="请输入手机号(可选)"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  size="large"
                  className="w-full h-12 text-lg font-medium"
                >
                  注册
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>

        <div className="text-center mt-6">
          <Button 
            type="link" 
            onClick={() => navigate('/admin')}
            className="text-blue-500 hover:text-blue-600"
          >
            管理员登录 →
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UserLogin; 