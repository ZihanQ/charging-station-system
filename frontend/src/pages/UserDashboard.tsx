import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Button, message, Modal, Form, Input, Select, Badge, Table } from 'antd';
import { 
  ThunderboltOutlined, 
  ClockCircleOutlined, 
  HistoryOutlined, 
  LogoutOutlined,
  PoweroffOutlined,
  DashboardOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

const UserDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [chargingRequestVisible, setChargingRequestVisible] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    navigate('/');
  };

  const onSubmitChargingRequest = async (values: any) => {
    setLoading(true);
    try {
      // TODO: 调用API提交充电请求
      console.log('充电请求:', values);
      message.success('充电请求已提交');
      setChargingRequestVisible(false);
    } catch (error) {
      message.error('提交失败');
    } finally {
      setLoading(false);
    }
  };

  // 模拟数据
  const queueInfo = {
    queueNumber: 'F3',
    position: 2,
    estimatedTime: '15分钟'
  };

  const chargingRecords = [
    {
      key: '1',
      recordNumber: 'CR001',
      chargingPile: 'A',
      amount: 25.5,
      duration: 0.85,
      startTime: '2024-01-15 14:30:00',
      endTime: '2024-01-15 15:21:00',
      chargingFee: 18.9,
      serviceFee: 20.4,
      totalFee: 39.3,
      status: '已完成'
    }
  ];

  const recordColumns = [
    { title: '详单编号', dataIndex: 'recordNumber', key: 'recordNumber' },
    { title: '充电桩', dataIndex: 'chargingPile', key: 'chargingPile' },
    { title: '充电量(度)', dataIndex: 'amount', key: 'amount' },
    { title: '充电时长(小时)', dataIndex: 'duration', key: 'duration' },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime' },
    { title: '充电费用(元)', dataIndex: 'chargingFee', key: 'chargingFee' },
    { title: '服务费用(元)', dataIndex: 'serviceFee', key: 'serviceFee' },
    { title: '总费用(元)', dataIndex: 'totalFee', key: 'totalFee' },
    { title: '状态', dataIndex: 'status', key: 'status' }
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '概览'
    },
    {
      key: 'charging',
      icon: <PoweroffOutlined />,
      label: '充电服务'
    },
    {
      key: 'queue',
      icon: <UnorderedListOutlined />,
      label: '排队状态'
    },
    {
      key: 'records',
      icon: <HistoryOutlined />,
      label: '充电记录'
    }
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <PoweroffOutlined className="text-3xl text-green-500 mr-4" />
                <div>
                  <h3 className="text-lg font-semibold">当前状态</h3>
                  <p className="text-gray-600">等候中</p>
                </div>
              </div>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <ClockCircleOutlined className="text-3xl text-orange-500 mr-4" />
                <div>
                  <h3 className="text-lg font-semibold">排队号码</h3>
                  <p className="text-gray-600">{queueInfo.queueNumber}</p>
                </div>
              </div>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <PoweroffOutlined className="text-3xl text-blue-500 mr-4" />
                <div>
                  <h3 className="text-lg font-semibold">预计等待</h3>
                  <p className="text-gray-600">{queueInfo.estimatedTime}</p>
                </div>
              </div>
            </Card>
          </div>
        );
      
      case 'charging':
        return (
          <Card title="充电服务" className="shadow-lg">
            <div className="text-center py-8">
              <PoweroffOutlined className="text-6xl text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-4">提交充电请求</h3>
              <p className="text-gray-600 mb-6">选择充电模式并设置充电量</p>
              <Button 
                type="primary" 
                size="large"
                onClick={() => setChargingRequestVisible(true)}
                className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
              >
                申请充电
              </Button>
            </div>
          </Card>
        );
      
      case 'queue':
        return (
          <Card title="排队状态" className="shadow-lg">
            <div className="text-center py-8">
              <div className="mb-6">
                <Badge count={queueInfo.position} offset={[10, 0]}>
                  <UnorderedListOutlined className="text-6xl text-blue-500" />
                </Badge>
              </div>
              <h3 className="text-xl font-semibold mb-2">当前排队号码</h3>
              <p className="text-3xl font-bold text-blue-500 mb-4">{queueInfo.queueNumber}</p>
              <p className="text-gray-600 mb-2">前方还有 <span className="font-semibold">{queueInfo.position}</span> 辆车</p>
              <p className="text-gray-600">预计等待时间: <span className="font-semibold">{queueInfo.estimatedTime}</span></p>
            </div>
          </Card>
        );
      
      case 'records':
        return (
          <Card title="充电记录" className="shadow-lg">
            <Table 
              columns={recordColumns} 
              dataSource={chargingRecords} 
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <Layout className="min-h-screen">
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
        className="shadow-lg"
      >
        <div className="h-16 flex items-center justify-center border-b">
          <h1 className={`font-bold text-blue-600 ${collapsed ? 'text-lg' : 'text-xl'}`}>
            {collapsed ? '⚡' : '⚡ 充电桩'}
          </h1>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[activeMenu]}
          items={menuItems}
          onClick={({ key }) => setActiveMenu(key)}
          className="border-none"
        />
      </Sider>
      
      <Layout>
        <Header className="bg-white shadow-sm px-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            欢迎回来，{user.username}
          </h2>
          <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            onClick={logout}
            className="hover:bg-red-50 hover:text-red-500"
          >
            退出登录
          </Button>
        </Header>
        
        <Content className="p-6 bg-gray-50">
          {renderContent()}
        </Content>
      </Layout>

      {/* 充电请求模态框 */}
      <Modal
        title="提交充电请求"
        open={chargingRequestVisible}
        onCancel={() => setChargingRequestVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          layout="vertical"
          onFinish={onSubmitChargingRequest}
          initialValues={{ chargingMode: 'FAST' }}
        >
          <Form.Item
            label="充电模式"
            name="chargingMode"
            rules={[{ required: true, message: '请选择充电模式' }]}
          >
            <Select size="large">
              <Option value="FAST">快充模式 (30度/小时)</Option>
              <Option value="SLOW">慢充模式 (7度/小时)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="电池总容量 (度)"
            name="batteryCapacity"
            rules={[{ required: true, message: '请输入电池总容量' }]}
          >
            <Input 
              type="number" 
              placeholder="请输入电池总容量"
              size="large"
              min={1}
              max={200}
            />
          </Form.Item>

          <Form.Item
            label="请求充电量 (度)"
            name="requestedAmount"
            rules={[{ required: true, message: '请输入充电量' }]}
          >
            <Input 
              type="number" 
              placeholder="请输入充电量"
              size="large"
              min={1}
              max={200}
            />
          </Form.Item>

          <Form.Item>
            <div className="flex gap-3">
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                className="flex-1"
              >
                提交请求
              </Button>
              <Button 
                size="large" 
                onClick={() => setChargingRequestVisible(false)}
              >
                取消
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default UserDashboard; 