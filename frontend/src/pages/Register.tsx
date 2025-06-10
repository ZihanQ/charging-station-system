import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, apiUtils } from '../services/api';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { 
    username: string; 
    email: string; 
    password: string; 
    confirmPassword: string;
    phoneNumber?: string;
  }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({
        username: values.username,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber
      });
      
      apiUtils.handleResponse(response);
      message.success('注册成功！请登录');
      navigate('/');
    } catch (error) {
      message.error(apiUtils.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full mb-4">
            <ThunderboltOutlined className="text-2xl" />
          </div>
          <Title level={2} className="text-gray-800 mb-2">充电桩系统</Title>
          <Text className="text-gray-600">用户注册</Text>
        </div>

        {/* 注册表单 */}
        <Card className="shadow-lg border-0">
          <Form
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, message: '请输入用户名!' },
                { min: 3, message: '用户名至少3个字符!' },
                { max: 20, message: '用户名不能超过20个字符!' }
              ]}
            >
              <Input 
                prefix={<UserOutlined className="text-gray-400" />} 
                placeholder="请输入用户名"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              label="邮箱地址"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱地址!' },
                { type: 'email', message: '请输入有效的邮箱地址!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined className="text-gray-400" />} 
                placeholder="请输入邮箱地址"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              label="手机号码"
              name="phoneNumber"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码!' }
              ]}
            >
              <Input 
                prefix={<PhoneOutlined className="text-gray-400" />} 
                placeholder="请输入手机号码（可选）"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码!' },
                { min: 6, message: '密码至少6个字符!' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400" />} 
                placeholder="请输入密码"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              label="确认密码"
              name="confirmPassword"
              rules={[
                { required: true, message: '请确认密码!' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400" />} 
                placeholder="请再次输入密码"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item className="mb-4">
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                className="w-full h-12 text-lg font-medium rounded-lg bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600"
              >
                注册
              </Button>
            </Form.Item>
          </Form>

          <Divider className="my-6" />

          <div className="text-center">
            <Text className="text-gray-600">已有账号？ </Text>
            <Link to="/" className="text-green-500 hover:text-green-600 font-medium">
              立即登录
            </Link>
          </div>
        </Card>

        {/* 使用须知 */}
        <div className="mt-8 text-center">
          <Text className="text-gray-500 text-sm">
            注册即表示您同意我们的服务条款和隐私政策
          </Text>
        </div>
      </div>
    </div>
  );
};

export default Register; 