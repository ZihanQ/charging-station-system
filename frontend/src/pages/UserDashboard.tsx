import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Button, message, Modal, Form, Input, Select, Badge, Table, Avatar, Dropdown } from 'antd';
import { 
  ThunderboltOutlined, 
  ClockCircleOutlined, 
  HistoryOutlined, 
  LogoutOutlined,
  PoweroffOutlined,
  DashboardOutlined,
  UnorderedListOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined
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
    Modal.confirm({
      title: '确认退出',
      content: '您确定要退出登录吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message.success('已退出登录');
        navigate('/');
      }
    });
  };

  const onSubmitChargingRequest = async (values: any) => {
    setLoading(true);
    try {
      // TODO: 调用API提交充电请求
      console.log('充电请求:', values);
      message.success('充电请求已提交，请等待调度');
      setChargingRequestVisible(false);
    } catch (error) {
      message.error('提交失败，请稍后重试');
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
    },
    {
      key: '2',
      recordNumber: 'CR002',
      chargingPile: 'B',
      amount: 30.2,
      duration: 1.2,
      startTime: '2024-01-16 09:15:00',
      endTime: '2024-01-16 10:27:00',
      chargingFee: 22.5,
      serviceFee: 24.1,
      totalFee: 46.6,
      status: '已完成'
    }
  ];

  const recordColumns = [
    { 
      title: '详单编号', 
      dataIndex: 'recordNumber', 
      key: 'recordNumber',
      width: 120
    },
    { 
      title: '充电桩', 
      dataIndex: 'chargingPile', 
      key: 'chargingPile',
      width: 80,
      render: (text: string) => (
        <Badge color="blue" text={`${text}桩`} />
      )
    },
    { 
      title: '充电量(度)', 
      dataIndex: 'amount', 
      key: 'amount',
      width: 100,
      render: (value: number) => `${value}度`
    },
    { 
      title: '时长(小时)', 
      dataIndex: 'duration', 
      key: 'duration',
      width: 100,
      render: (value: number) => `${value}h`
    },
    { 
      title: '开始时间', 
      dataIndex: 'startTime', 
      key: 'startTime',
      width: 150
    },
    { 
      title: '结束时间', 
      dataIndex: 'endTime', 
      key: 'endTime',
      width: 150
    },
    { 
      title: '总费用(元)', 
      dataIndex: 'totalFee', 
      key: 'totalFee',
      width: 100,
      render: (value: number) => (
        <span className="font-semibold text-green-600">¥{value}</span>
      )
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Badge 
          status={status === '已完成' ? 'success' : 'processing'} 
          text={status} 
        />
      )
    }
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '概览面板',
      className: 'hover:bg-blue-50'
    },
    {
      key: 'charging',
      icon: <PoweroffOutlined />,
      label: '充电服务',
      className: 'hover:bg-green-50'
    },
    {
      key: 'queue',
      icon: <UnorderedListOutlined />,
      label: '排队状态',
      className: 'hover:bg-orange-50'
    },
    {
      key: 'records',
      icon: <HistoryOutlined />,
      label: '充电记录',
      className: 'hover:bg-purple-50'
    }
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full mr-4">
                    <PoweroffOutlined className="text-2xl text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">当前状态</h3>
                    <p className="text-gray-600">等候充电中</p>
                  </div>
                </div>
              </Card>
              
              <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-full mr-4">
                    <ClockCircleOutlined className="text-2xl text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">排队号码</h3>
                    <p className="text-2xl font-bold text-orange-600">{queueInfo.queueNumber}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full mr-4">
                    <ClockCircleOutlined className="text-2xl text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">预计等待</h3>
                    <p className="text-2xl font-bold text-blue-600">{queueInfo.estimatedTime}</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="快速操作" className="shadow-lg">
                <div className="space-y-4">
                  <Button 
                    type="primary" 
                    icon={<PoweroffOutlined />}
                    size="large"
                    onClick={() => setChargingRequestVisible(true)}
                    className="w-full"
                  >
                    申请充电
                  </Button>
                  <Button 
                    icon={<UnorderedListOutlined />}
                    size="large"
                    onClick={() => setActiveMenu('queue')}
                    className="w-full"
                  >
                    查看排队
                  </Button>
                </div>
              </Card>

              <Card title="今日统计" className="shadow-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">2</div>
                    <div className="text-gray-600">充电次数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">¥86.9</div>
                    <div className="text-gray-600">总费用</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );
      
      case 'charging':
        return (
          <Card title="充电服务" className="shadow-lg">
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-4">
                  <PoweroffOutlined className="text-4xl text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">提交充电请求</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                选择充电模式并设置充电量，系统将为您智能分配充电桩
              </p>
              <Button 
                type="primary" 
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={() => setChargingRequestVisible(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 border-0 hover:from-green-600 hover:to-green-700 h-12 px-8 text-lg font-medium rounded-lg shadow-lg"
              >
                立即申请充电
              </Button>
            </div>
          </Card>
        );
      
      case 'queue':
        return (
          <Card title="排队状态" className="shadow-lg">
            <div className="text-center py-12">
              <div className="mb-8">
                <Badge count={queueInfo.position} offset={[15, 0]} size="default">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full">
                    <UnorderedListOutlined className="text-4xl text-white" />
                  </div>
                </Badge>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">当前排队号码</h3>
              <div className="text-6xl font-bold text-blue-600 mb-6">{queueInfo.queueNumber}</div>
              <div className="space-y-2 text-lg">
                <p className="text-gray-700">
                  前方还有 <span className="font-bold text-orange-500">{queueInfo.position}</span> 辆车
                </p>
                <p className="text-gray-700">
                  预计等待时间: <span className="font-bold text-blue-500">{queueInfo.estimatedTime}</span>
                </p>
              </div>
            </div>
          </Card>
        );
      
      case 'records':
        return (
          <Card title="充电记录" className="shadow-lg">
            <Table 
              columns={recordColumns} 
              dataSource={chargingRecords} 
              scroll={{ x: 1000 }}
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
      
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    const titles = {
      dashboard: '概览面板',
      charging: '充电服务',
      queue: '排队状态',
      records: '充电记录'
    };
    return titles[activeMenu as keyof typeof titles] || '用户中心';
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
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
          <h1 className={`font-bold text-white ${collapsed ? 'text-lg' : 'text-xl'}`}>
            {collapsed ? '⚡' : '⚡ 智能充电桩'}
          </h1>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[activeMenu]}
          items={menuItems}
          onClick={({ key }) => setActiveMenu(key)}
          className="border-none pt-4"
        />

        {/* 侧边栏底部用户信息 */}
        {!collapsed && (
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar icon={<UserOutlined />} className="bg-blue-500" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.username || '用户'}
                </div>
                <div className="text-xs text-gray-500">普通用户</div>
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
              className="text-gray-600 hover:text-blue-600"
            />
            <h2 className="text-xl font-semibold text-gray-800">
              {getPageTitle()}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">欢迎回来，{user.username}</span>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button 
                type="text" 
                className="flex items-center space-x-2 hover:bg-gray-50"
              >
                <Avatar icon={<UserOutlined />} size="small" className="bg-blue-500" />
              </Button>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="p-6">
          {renderContent()}
        </Content>
      </Layout>

      {/* 充电请求模态框 */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <ThunderboltOutlined className="text-green-500" />
            <span>提交充电请求</span>
          </div>
        }
        open={chargingRequestVisible}
        onCancel={() => setChargingRequestVisible(false)}
        footer={null}
        width={500}
        className="rounded-lg"
      >
        <Form
          layout="vertical"
          onFinish={onSubmitChargingRequest}
          initialValues={{ chargingMode: 'FAST' }}
          size="large"
        >
          <Form.Item
            label="充电模式"
            name="chargingMode"
            rules={[{ required: true, message: '请选择充电模式' }]}
          >
            <Select className="rounded-lg">
              <Option value="FAST">⚡ 快充模式 (30度/小时)</Option>
              <Option value="SLOW">🔋 慢充模式 (7度/小时)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="电池总容量 (度)"
            name="batteryCapacity"
            rules={[
              { required: true, message: '请输入电池总容量' },
              { type: 'number', min: 1, max: 200, message: '容量范围1-200度' }
            ]}
          >
            <Input 
              type="number" 
              placeholder="请输入电池总容量"
              className="rounded-lg"
              min={1}
              max={200}
              suffix="度"
            />
          </Form.Item>

          <Form.Item
            label="请求充电量 (度)"
            name="requestedAmount"
            rules={[
              { required: true, message: '请输入充电量' },
              { type: 'number', min: 1, max: 200, message: '充电量范围1-200度' }
            ]}
          >
            <Input 
              type="number" 
              placeholder="请输入充电量"
              className="rounded-lg"
              min={1}
              max={200}
              suffix="度"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex gap-3">
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                className="flex-1 h-12 rounded-lg bg-gradient-to-r from-green-500 to-green-600 border-0 hover:from-green-600 hover:to-green-700"
              >
                {loading ? '提交中...' : '提交请求'}
              </Button>
              <Button 
                className="h-12 rounded-lg" 
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