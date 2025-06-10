import React, { useState } from 'react';
import { Layout, Menu, Card, Button, message, Table, Tag, Switch, Statistic, Row, Col, Avatar, Dropdown, Modal } from 'antd';
import { 
  DashboardOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  PoweroffOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const AdminDashboard: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '您确定要退出管理系统吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message.success('已退出登录');
        navigate('/admin');
      }
    });
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
    },
    {
      key: '3',
      queueNumber: 'F3',
      username: '孙七',
      chargingMode: '慢充',
      requestedAmount: 40,
      waitingTime: '15分钟',
      status: 'WAITING'
    }
  ];

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return <Tag color="success" icon={<CheckCircleOutlined />}>正常运行</Tag>;
      case 'FAULT':
        return <Tag color="error" icon={<ExclamationCircleOutlined />}>故障维修</Tag>;
      case 'DISABLED':
        return <Tag color="default">已关闭</Tag>;
      default:
        return <Tag>未知状态</Tag>;
    }
  };

  const pileColumns = [
    { 
      title: '充电桩', 
      dataIndex: 'name', 
      key: 'name',
      width: 80,
      render: (text: string) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold">{text}</span>
          </div>
          <span>{text}桩</span>
        </div>
      )
    },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === '快充' ? 'orange' : 'blue'}>{type}</Tag>
      )
    },
    { 
      title: '功率', 
      dataIndex: 'power', 
      key: 'power',
      width: 80,
      render: (power: number) => `${power}kW`
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status)
    },
    { 
      title: '当前用户', 
      dataIndex: 'currentUser', 
      key: 'currentUser',
      width: 100,
      render: (user: string) => user || <span className="text-gray-400">空闲</span>
    },
    { 
      title: '充电进度', 
      dataIndex: 'progress', 
      key: 'progress',
      width: 100,
      render: (progress: number) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm">{progress}%</span>
        </div>
      )
    },
    { 
      title: '预计剩余', 
      dataIndex: 'estimatedTime', 
      key: 'estimatedTime',
      width: 100,
      render: (time: string) => time || <span className="text-gray-400">-</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Switch 
          checked={record.status === 'NORMAL'} 
          checkedChildren="启用" 
          unCheckedChildren="禁用"
          onChange={(checked) => {
            message.success(`充电桩${record.name}已${checked ? '启用' : '禁用'}`);
          }}
        />
      )
    }
  ];

  const queueColumns = [
    { 
      title: '排队号', 
      dataIndex: 'queueNumber', 
      key: 'queueNumber',
      width: 100,
      render: (queueNumber: string) => (
        <Tag color="blue" className="font-medium">{queueNumber}</Tag>
      )
    },
    { 
      title: '用户', 
      dataIndex: 'username', 
      key: 'username',
      width: 100,
      render: (username: string) => (
        <div className="flex items-center space-x-2">
          <Avatar size="small" icon={<UserOutlined />} className="bg-green-500" />
          <span>{username}</span>
        </div>
      )
    },
    { 
      title: '充电模式', 
      dataIndex: 'chargingMode', 
      key: 'chargingMode',
      width: 100,
      render: (mode: string) => (
        <Tag color={mode === '快充' ? 'orange' : 'blue'}>{mode}</Tag>
      )
    },
    { 
      title: '请求充电量', 
      dataIndex: 'requestedAmount', 
      key: 'requestedAmount',
      width: 120,
      render: (amount: number) => `${amount}度`
    },
    { 
      title: '等待时间', 
      dataIndex: 'waitingTime', 
      key: 'waitingTime',
      width: 100
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color="processing">等待中</Tag>
      )
    }
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '管理概览',
      className: 'hover:bg-blue-50'
    },
    {
      key: 'piles',
      icon: <ThunderboltOutlined />,
      label: '充电桩管理',
      className: 'hover:bg-green-50'
    },
    {
      key: 'queue',
      icon: <UnorderedListOutlined />,
      label: '排队管理',
      className: 'hover:bg-orange-50'
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: '统计报表',
      className: 'hover:bg-purple-50'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      className: 'hover:bg-gray-50'
    }
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '管理员资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <Row gutter={16}>
              <Col span={6}>
                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                  <Statistic
                    title="总充电桩数"
                    value={5}
                    prefix={<div className="p-2 bg-green-100 rounded-full inline-flex"><ThunderboltOutlined className="text-green-600" /></div>}
                    valueStyle={{ color: '#16a34a', fontSize: '2rem', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                  <Statistic
                    title="正常运行"
                    value={3}
                    prefix={<div className="p-2 bg-blue-100 rounded-full inline-flex"><CheckCircleOutlined className="text-blue-600" /></div>}
                    valueStyle={{ color: '#2563eb', fontSize: '2rem', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
                  <Statistic
                    title="当前排队"
                    value={3}
                    prefix={<div className="p-2 bg-orange-100 rounded-full inline-flex"><UnorderedListOutlined className="text-orange-600" /></div>}
                    valueStyle={{ color: '#ea580c', fontSize: '2rem', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500">
                  <Statistic
                    title="故障设备"
                    value={1}
                    prefix={<div className="p-2 bg-red-100 rounded-full inline-flex"><ExclamationCircleOutlined className="text-red-600" /></div>}
                    valueStyle={{ color: '#dc2626', fontSize: '2rem', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={16}>
                <Card title="充电桩状态" className="shadow-lg">
                  <Table 
                    columns={pileColumns} 
                    dataSource={chargingPiles} 
                    pagination={false}
                    size="middle"
                    className="rounded-lg"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card title="实时监控" className="shadow-lg">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600 mb-1">系统状态</div>
                      <div className="text-lg font-semibold text-green-800">正常运行</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600 mb-1">总用电量(今日)</div>
                      <div className="text-lg font-semibold text-blue-800">1,247 kWh</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-600 mb-1">服务次数(今日)</div>
                      <div className="text-lg font-semibold text-purple-800">28 次</div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        );
      
      case 'piles':
        return (
          <Card title="充电桩管理" className="shadow-lg">
            <Table 
              columns={pileColumns} 
              dataSource={chargingPiles} 
              scroll={{ x: 800 }}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
              }}
              className="rounded-lg"
            />
          </Card>
        );
      
      case 'queue':
        return (
          <Card title="排队管理" className="shadow-lg">
            <Table 
              columns={queueColumns} 
              dataSource={queueData} 
              scroll={{ x: 600 }}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
              }}
              className="rounded-lg"
            />
          </Card>
        );
      
      case 'reports':
        return (
          <div className="space-y-6">
            <Row gutter={16}>
              <Col span={8}>
                <Card title="今日统计" className="shadow-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>充电次数</span>
                      <span className="font-semibold text-blue-600">28次</span>
                    </div>
                    <div className="flex justify-between">
                      <span>总用电量</span>
                      <span className="font-semibold text-green-600">1,247度</span>
                    </div>
                    <div className="flex justify-between">
                      <span>总收入</span>
                      <span className="font-semibold text-purple-600">¥2,456</span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="本周统计" className="shadow-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>充电次数</span>
                      <span className="font-semibold text-blue-600">186次</span>
                    </div>
                    <div className="flex justify-between">
                      <span>总用电量</span>
                      <span className="font-semibold text-green-600">8,932度</span>
                    </div>
                    <div className="flex justify-between">
                      <span>总收入</span>
                      <span className="font-semibold text-purple-600">¥17,234</span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="本月统计" className="shadow-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>充电次数</span>
                      <span className="font-semibold text-blue-600">756次</span>
                    </div>
                    <div className="flex justify-between">
                      <span>总用电量</span>
                      <span className="font-semibold text-green-600">34,567度</span>
                    </div>
                    <div className="flex justify-between">
                      <span>总收入</span>
                      <span className="font-semibold text-purple-600">¥68,945</span>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        );
      
      case 'settings':
        return (
          <Card title="系统设置" className="shadow-lg">
            <div className="max-w-2xl">
              <div className="space-y-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">充电价格设置</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        快充价格 (元/度)
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue="1.2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        慢充价格 (元/度)
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue="0.8"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">服务费设置</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      服务费 (元/度)
                    </label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      defaultValue="0.8"
                    />
                  </div>
                </div>

                <Button type="primary" size="large" className="w-full">
                  保存设置
                </Button>
              </div>
            </div>
          </Card>
        );
      
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    const titles = {
      dashboard: '管理概览',
      piles: '充电桩管理',
      queue: '排队管理',
      reports: '统计报表',
      settings: '系统设置'
    };
    return titles[activeMenu as keyof typeof titles] || '管理中心';
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
        className="shadow-lg border-r border-gray-200"
        width={250}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-600">
          <h1 className={`font-bold text-white ${collapsed ? 'text-lg' : 'text-xl'}`}>
            {collapsed ? '⚙️' : '⚙️ 管理中心'}
          </h1>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[activeMenu]}
          items={menuItems}
          onClick={({ key }) => setActiveMenu(key)}
          className="border-none pt-4"
        />

        {/* 侧边栏底部管理员信息 */}
        {!collapsed && (
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar icon={<UserOutlined />} className="bg-purple-500" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.username || '管理员'}
                </div>
                <div className="text-xs text-gray-500">系统管理员</div>
              </div>
            </div>
          </div>
        )}
      </Sider>
      
      <Layout>
        <Header className="bg-white shadow-sm px-6 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-600 hover:text-purple-600"
            />
            <h2 className="text-xl font-semibold text-gray-800">
              {getPageTitle()}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">管理员：{user.username}</span>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button 
                type="text" 
                className="flex items-center space-x-2 hover:bg-gray-50"
              >
                <Avatar icon={<UserOutlined />} size="small" className="bg-purple-500" />
              </Button>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="p-6">
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard; 