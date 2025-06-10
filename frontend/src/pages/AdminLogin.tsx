import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, apiUtils } from '../services/api';
import { authService } from '../services/auth';
import { webSocketService } from '../services/websocket';

const { Title, Text } = Typography;

const AdminLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 迁移旧的存储格式
    authService.migrateOldStorage();
    
    // 移除自动跳转逻辑，让管理员可以选择重新登录
  }, [navigate]);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authAPI.adminLogin({
        email: values.username,  // 假设用户名实际上是邮箱
        password: values.password
      });
      const data = apiUtils.handleResponse<{
        user: { id: string; username: string; email: string; role: 'USER' | 'ADMIN' };
        token: string;
      }>(response);

      if (data.user.role !== 'ADMIN') {
        message.error('您没有管理员权限');
        return;
      }

      // 使用新的认证服务保存数据
      authService.saveAuthData({ user: data.user, token: data.token });

      // 连接WebSocket
      webSocketService.connect(data.user.id, data.user.role);

      message.success('登录成功！');
      navigate('/admin/dashboard');
    } catch (error) {
      message.error(apiUtils.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 text-white rounded-full mb-4">
            <ThunderboltOutlined className="text-2xl" />
          </div>
          <Title level={2} className="text-gray-800 mb-2">充电桩管理系统</Title>
          <Text className="text-gray-600">管理员登录</Text>
        </div>

        {/* 登录表单 */}
        <Card className="shadow-lg border-0">
          <Form
            name="adminLogin"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              label="管理员账号"
              name="username"
              rules={[{ required: true, message: '请输入管理员账号!' }]}
            >
              <Input 
                prefix={<UserOutlined className="text-gray-400" />} 
                placeholder="请输入管理员账号"
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
                className="w-full h-12 text-lg font-medium rounded-lg bg-purple-500 border-purple-500 hover:bg-purple-600 hover:border-purple-600"
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          <Divider className="my-6" />

          <div className="text-center">
            <Text className="text-gray-600">普通用户？ </Text>
            <Link to="/" className="text-purple-500 hover:text-purple-600 font-medium">
              用户登录
            </Link>
          </div>
        </Card>

        {/* 管理员提示 */}
        <div className="mt-8 text-center">
          <Text className="text-gray-500 text-sm">
            🔒 管理员专用入口 • 系统管理 • 数据监控
          </Text>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 