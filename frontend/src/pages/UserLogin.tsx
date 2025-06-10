import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { TabPane } = Tabs;

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

const UserLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const navigate = useNavigate();

  const onLogin = async (values: LoginForm) => {
    setLoading(true);
    setLoginError('');
    
    try {
      const response = await axios.post('/api/auth/login', values);
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        message.success('登录成功！');
        navigate('/user');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '登录失败，请稍后重试';
      setLoginError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: RegisterForm) => {
    setLoading(true);
    setRegisterError('');
    
    try {
      const response = await axios.post('/api/auth/register', values);
      if (response.data.success) {
        message.success('注册成功！请登录');
        setActiveTab('login');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '注册失败，请稍后重试';
      setRegisterError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setLoginError('');
    setRegisterError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 顶部装饰 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <span className="text-3xl">⚡</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            智能充电桩系统
          </h1>
          <p className="text-gray-600">欢迎使用充电调度服务</p>
        </div>

        <Card 
          className="shadow-2xl border-0 rounded-2xl backdrop-blur-sm bg-white/95"
          bodyStyle={{ padding: '2rem' }}
        >
          <Tabs 
            activeKey={activeTab}
            onChange={handleTabChange}
            centered
            size="large"
            className="mb-4"
          >
            <TabPane tab="登录" key="login">
              {loginError && (
                <Alert
                  message={loginError}
                  type="error"
                  showIcon
                  className="mb-4"
                  closable
                  onClose={() => setLoginError('')}
                />
              )}
              
              <Form
                name="login"
                onFinish={onLogin}
                autoComplete="off"
                layout="vertical"
                size="large"
              >
                <Form.Item
                  label="邮箱地址"
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined className="text-gray-400" />} 
                    placeholder="请输入邮箱地址"
                    className="rounded-lg h-12"
                  />
                </Form.Item>

                <Form.Item
                  label="登录密码"
                  name="password"
                  rules={[{ required: true, message: '请输入登录密码' }]}
                >
                  <Input.Password 
                    prefix={<LockOutlined className="text-gray-400" />} 
                    placeholder="请输入登录密码"
                    className="rounded-lg h-12"
                  />
                </Form.Item>

                <Form.Item className="mb-6">
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    className="w-full h-12 text-lg font-medium rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 border-0 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                  >
                    {loading ? '登录中...' : '立即登录'}
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
            
            <TabPane tab="注册" key="register">
              {registerError && (
                <Alert
                  message={registerError}
                  type="error"
                  showIcon
                  className="mb-4"
                  closable
                  onClose={() => setRegisterError('')}
                />
              )}
              
              <Form
                name="register"
                onFinish={onRegister}
                autoComplete="off"
                layout="vertical"
                size="large"
              >
                <Form.Item
                  label="用户名"
                  name="username"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, message: '用户名至少需要3个字符' },
                    { max: 20, message: '用户名不能超过20个字符' }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined className="text-gray-400" />} 
                    placeholder="请输入用户名"
                    className="rounded-lg h-12"
                  />
                </Form.Item>

                <Form.Item
                  label="邮箱地址"
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined className="text-gray-400" />} 
                    placeholder="请输入邮箱地址"
                    className="rounded-lg h-12"
                  />
                </Form.Item>

                <Form.Item
                  label="登录密码"
                  name="password"
                  rules={[
                    { required: true, message: '请输入登录密码' },
                    { min: 6, message: '密码至少需要6个字符' }
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined className="text-gray-400" />} 
                    placeholder="请输入登录密码"
                    className="rounded-lg h-12"
                  />
                </Form.Item>

                <Form.Item
                  label="手机号码"
                  name="phoneNumber"
                  rules={[
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                  ]}
                >
                  <Input 
                    prefix={<PhoneOutlined className="text-gray-400" />} 
                    placeholder="请输入手机号码（可选）"
                    className="rounded-lg h-12"
                  />
                </Form.Item>

                <Form.Item className="mb-6">
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    className="w-full h-12 text-lg font-medium rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 border-0 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                  >
                    {loading ? '注册中...' : '立即注册'}
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>

          <div className="text-center pt-4 border-t border-gray-100">
            <Button 
              type="link" 
              onClick={() => navigate('/admin')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              管理员登录 →
            </Button>
          </div>
        </Card>

        {/* 底部提示 */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>© 2024 智能充电桩系统 - 让充电更智能</p>
        </div>
      </div>
    </div>
  );
};

export default UserLogin; 