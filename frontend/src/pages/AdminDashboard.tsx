import React, { useState } from 'react';
import { Layout, Menu, Card, Button, message, Table, Tag, Switch, Statistic, Row, Col } from 'antd';
import { 
  DashboardOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  PoweroffOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const AdminDashboard: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('已退出登录');
    navigate('/admin');
  };

  // 模拟数据
  const chargingPiles = [
    {
      key: '1',
      name: 'A',
      type: '快充',
      power: 30,
      status: 'NORMAL',
      currentUser: '张三',
      progress: 75,
      estimatedTime: '15分钟'
    },
    {
      key: '2',
      name: 'B',
      type: '快充',
      power: 30,
      status: 'NORMAL',
      currentUser: '李四',
      progress: 45,
      estimatedTime: '30分钟'
    },
    {
      key: '3',
      name: 'C',
      type: '慢充',
      power: 7,
      status: 'FAULT',
      currentUser: null,
      progress: 0,
      estimatedTime: null
    },
    {
      key: '4',
      name: 'D',
      type: '慢充',
      power: 7,
      status: 'NORMAL',
      currentUser: null,
      progress: 0,
      estimatedTime: null
    },
    {
      key: '5',
      name: 'E',
      type: '慢充',
      power: 7,
      status: 'DISABLED',
      currentUser: null,
      progress: 0,
      estimatedTime: null
    }
  ];

  const queueData = [
    {
      key: '1',
      queueNumber: 'F1',
      username: '王五',
      chargingMode: '快充',
      requestedAmount: 30,
      waitingTime: '5分钟',
      status: 'WAITING'
    },
    {
      key: '2',
      queueNumber: 'F2',
      username: '赵六',
      chargingMode: '快充',
      requestedAmount: 25,
      waitingTime: '10分钟',
      status: 'WAITING'
    }
  ];

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return <Tag color="green" icon={<CheckCircleOutlined />}>正常</Tag>;
      case 'FAULT':
        return <Tag color="red" icon={<ExclamationCircleOutlined />}>故障</Tag>;
      case 'DISABLED':
        return <Tag color="gray">已关闭</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const pileColumns = [
    { title: '充电桩', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '功率(kW)', dataIndex: 'power', key: 'power' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    { title: '当前用户', dataIndex: 'currentUser', key: 'currentUser' },
    { title: '充电进度(%)', dataIndex: 'progress', key: 'progress' },
    { title: '预计剩余时间', dataIndex: 'estimatedTime', key: 'estimatedTime' },
    {
      title: '操作',
      key: 'action',
      render: (_, record: any) => (
        <div className="space-x-2">
          <Switch 
            checked={record.status === 'NORMAL'} 
            checkedChildren="启用" 
            unCheckedChildren="禁用"
            onChange={(checked) => {
              message.success(`充电桩${record.name}已${checked ? '启用' : '禁用'}`);
            }}
          />
        </div>
      )
    }
  ];

  const queueColumns = [
    { title: '排队号', dataIndex: 'queueNumber', key: 'queueNumber' },
    { title: '用户', dataIndex: 'username', key: 'username' },
    { title: '充电模式', dataIndex: 'chargingMode', key: 'chargingMode' },
    { title: '请求充电量(度)', dataIndex: 'requestedAmount', key: 'requestedAmount' },
    { title: '等待时间', dataIndex: 'waitingTime', key: 'waitingTime' },
    { title: '状态', dataIndex: 'status', key: 'status' }
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '概览'
    },
    {
      key: 'piles',
      icon: <ThunderboltOutlined />,
      label: '充电桩管理'
    },
    {
      key: 'queue',
      icon: <BarChartOutlined />,
      label: '排队管理'
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: '统计报表'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置'
    }
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <div>
            <Row gutter={16} className="mb-6">
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总充电桩数"
                    value={5}
                    prefix={<ThunderboltOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="正常运行"
                    value={3}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="故障数量"
                    value={1}
                    prefix={<ExclamationCircleOutlined />}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="排队人数"
                    value={2}
                    prefix={<PoweroffOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>
            
            <Card title="充电桩状态概览" className="shadow-lg">
              <Table 
                columns={pileColumns} 
                dataSource={chargingPiles} 
                pagination={false}
              />
            </Card>
          </div>
        );
      
      case 'piles':
        return (
          <Card title="充电桩管理" className="shadow-lg">
            <Table 
              columns={pileColumns} 
              dataSource={chargingPiles} 
              pagination={{ pageSize: 10 }}
            />
          </Card>
        );
      
      case 'queue':
        return (
          <Card title="排队管理" className="shadow-lg">
            <Table 
              columns={queueColumns} 
              dataSource={queueData} 
              pagination={{ pageSize: 10 }}
            />
          </Card>
        );
      
      case 'reports':
        return (
          <Card title="统计报表" className="shadow-lg">
            <div className="text-center py-8">
              <BarChartOutlined className="text-6xl text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-4">统计报表功能</h3>
              <p className="text-gray-600">此功能正在开发中...</p>
            </div>
          </Card>
        );
      
      case 'settings':
        return (
          <Card title="系统设置" className="shadow-lg">
            <div className="text-center py-8">
              <SettingOutlined className="text-6xl text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold mb-4">系统设置</h3>
              <p className="text-gray-600">此功能正在开发中...</p>
            </div>
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
        theme="dark"
        className="shadow-lg"
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-700">
          <h1 className={`font-bold text-white ${collapsed ? 'text-lg' : 'text-xl'}`}>
            {collapsed ? '⚡' : '⚡ 管理中心'}
          </h1>
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeMenu]}
          items={menuItems}
          onClick={({ key }) => setActiveMenu(key)}
        />
      </Sider>
      
      <Layout>
        <Header className="bg-white shadow-sm px-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            管理员控制台 - {user.username}
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
    </Layout>
  );
};

export default AdminDashboard; 