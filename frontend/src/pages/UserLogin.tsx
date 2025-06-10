import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, apiUtils } from '../services/api';
import { authService } from '../services/auth';
import { webSocketService } from '../services/websocket';

const { Title, Text } = Typography;

const UserLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 迁移旧的存储格式
    authService.migrateOldStorage();
    
    // 移除自动跳转逻辑，让用户可以选择重新登录
  }, [navigate]);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authAPI.login({
        email: values.username,  // 假设用户名实际上是邮箱
        password: values.password
      });
      const data = apiUtils.handleResponse<{
        user: { id: string; username: string; email: string; role: 'USER' | 'ADMIN' };
        token: string;
      }>(response);

      if (data.user.role !== 'USER') {
        message.error('请使用管理员登录页面');
        return;
      }

      // 使用新的认证服务保存数据
      authService.saveAuthData({ user: data.user, token: data.token });

      // 连接WebSocket
      webSocketService.connect(data.user.id, data.user.role);

      message.success('登录成功！');
      navigate('/user');
    } catch (error) {
      message.error(apiUtils.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full mb-4">
            <ThunderboltOutlined className="text-2xl" />
          </div>
          <Title level={2} className="text-gray-800 mb-2">充电桩系统</Title>
          <Text className="text-gray-600">用户登录</Text>
        </div>

        {/* 登录表单 */}
        <Card className="shadow-lg border-0">
          <Form
            name="userLogin"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名!' }]}
            >
              <Input 
                prefix={<UserOutlined className="text-gray-400" />} 
                placeholder="请输入用户名"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码!' }]}
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400" />} 
                placeholder="请输入密码"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item className="mb-4">
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                className="w-full h-12 text-lg font-medium rounded-lg bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600"
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <Divider className="my-6" />

          <div className="text-center space-y-3">
            <div>
              <Text className="text-gray-600">管理员？ </Text>
              <Link to="/admin" className="text-blue-500 hover:text-blue-600 font-medium">
                管理员登录
              </Link>
            </div>
            <div>
              <Text className="text-gray-600">还没有账号？ </Text>
              <Link to="/register" className="text-blue-500 hover:text-blue-600 font-medium">
                立即注册
              </Link>
            </div>
          </div>
        </Card>

        {/* 系统特性 */}
        <div className="mt-8 text-center">
          <Text className="text-gray-500 text-sm">
            智能排队 • 实时监控 • 便捷充电
          </Text>
        </div>
      </div>
    </div>
  );
};

export default UserLogin; 