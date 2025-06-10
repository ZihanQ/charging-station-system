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
import { chargingAPI, userAPI, apiUtils } from '../services/api';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

interface QueueInfo {
  queueNumber?: string;
  position?: number;
  estimatedTime?: string;
  status?: string;
  chargingMode?: string;
  chargingPile?: any;
}

interface UserStats {
  total: {
    records: number;
    amount: number;
    fee: number;
  };
  monthly: {
    records: number;
    fee: number;
  };
  currentQueue: QueueInfo | null;
}

interface ChargingRecord {
  id: string;
  recordNumber: string;
  chargingPile: string;
  chargingPileType: string;
  actualAmount: number;
  totalFee: number;
  status: string;
  startTime: string;
  endTime?: string;
  createdAt: string;
}

const UserDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [chargingRequestVisible, setChargingRequestVisible] = useState(false);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [chargingRecords, setChargingRecords] = useState<ChargingRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // 页面加载时获取数据
  useEffect(() => {
    loadInitialData();
    // 设置定时刷新队列状态
    const interval = setInterval(() => {
      if (activeMenu === 'queue' || activeMenu === 'dashboard') {
        loadQueueStatus();
      }
    }, 10000); // 每10秒刷新一次

    return () => clearInterval(interval);
  }, []);

  // 根据当前菜单加载相应数据
  useEffect(() => {
    switch (activeMenu) {
      case 'dashboard':
        loadUserStats();
        loadQueueStatus();
        break;
      case 'queue':
        loadQueueStatus();
        break;
      case 'records':
        loadChargingRecords();
        break;
    }
  }, [activeMenu]);

  // 加载初始数据
  const loadInitialData = async () => {
    await Promise.all([
      loadUserStats(),
      loadQueueStatus()
    ]);
  };

  // 加载用户统计数据
  const loadUserStats = async () => {
    try {
      const response = await userAPI.getStatistics();
      const stats = apiUtils.handleResponse<UserStats>(response);
      setUserStats(stats);
    } catch (error) {
      console.error('获取用户统计失败:', error);
    }
  };

  // 加载排队状态
  const loadQueueStatus = async () => {
    try {
      const response = await chargingAPI.getQueueStatus();
      const queueData = apiUtils.handleResponse<QueueInfo | null>(response);
      setQueueInfo(queueData);
    } catch (error) {
      console.error('获取排队状态失败:', error);
    }
  };

  // 加载充电记录
  const loadChargingRecords = async (page: number = 1, limit: number = 10) => {
    setRecordsLoading(true);
    try {
      const response = await chargingAPI.getRecords(page, limit);
      const data = apiUtils.handleResponse<{
        records: ChargingRecord[];
        pagination: any;
      }>(response);
      
      setChargingRecords(data.records);
      setPagination({
        current: data.pagination.current,
        pageSize: data.pagination.pageSize,
        total: data.pagination.total
      });
    } catch (error) {
      message.error(apiUtils.handleError(error));
    } finally {
      setRecordsLoading(false);
    }
  };

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
      const response = await chargingAPI.submitRequest({
        batteryCapacity: values.batteryCapacity,
        requestedAmount: values.requestedAmount,
        chargingMode: values.chargingMode
      });
      
      const result = apiUtils.handleResponse(response);
      message.success('充电请求已提交，请等待调度');
      setChargingRequestVisible(false);
      
      // 刷新队列状态
      loadQueueStatus();
      loadUserStats();
    } catch (error) {
      message.error(apiUtils.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  // 取消充电请求
  const cancelChargingRequest = async () => {
    if (!queueInfo?.queueNumber) return;
    
    Modal.confirm({
      title: '确认取消',
      content: '您确定要取消当前的充电请求吗？',
      okText: '确认',
      cancelText: '返回',
      onOk: async () => {
        try {
          await chargingAPI.cancelRequest(queueInfo.queueNumber!);
          message.success('充电请求已取消');
          loadQueueStatus();
          loadUserStats();
        } catch (error) {
          message.error(apiUtils.handleError(error));
        }
      }
    });
  };

  const recordColumns = [
    { 
      title: '详单编号', 
      dataIndex: 'recordNumber', 
      key: 'recordNumber',
      width: 200,
      render: (text: string, record: ChargingRecord) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/record/${record.id}`)}
          className="p-0 h-auto font-mono text-blue-600 hover:text-blue-800"
        >
          {text}
        </Button>
      )
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusMap = {
          'COMPLETED': { status: 'success', text: '已完成' },
          'CHARGING': { status: 'processing', text: '充电中' },
          'WAITING': { status: 'warning', text: '等待中' },
          'CANCELLED': { status: 'error', text: '已取消' },
          'FAULT': { status: 'error', text: '故障' }
        };
        const statusInfo = statusMap[status as keyof typeof statusMap] || { status: 'default', text: status };
        return <Badge status={statusInfo.status as any} text={statusInfo.text} />;
      }
    },
    { 
      title: '操作', 
      key: 'action',
      width: 120,
      render: (_: any, record: ChargingRecord) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => navigate(`/record/${record.id}`)}
        >
          查看详情
        </Button>
      )
    }
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
                    <p className="text-gray-600">
                      {queueInfo ? 
                        (queueInfo.status === 'CHARGING' ? '充电中' : 
                         queueInfo.status === 'WAITING' || queueInfo.status === 'IN_QUEUE' ? '等候充电中' : '无排队') 
                        : '无排队'}
                    </p>
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
                    <p className="text-2xl font-bold text-orange-600">
                      {queueInfo?.queueNumber || '-'}
                    </p>
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
                    <p className="text-2xl font-bold text-blue-600">
                      {queueInfo?.estimatedTime || '-'}
                    </p>
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
                    disabled={queueInfo !== null && queueInfo.status !== 'COMPLETED'}
                  >
                    申请充电
                  </Button>
                  {queueInfo && (queueInfo.status === 'WAITING' || queueInfo.status === 'IN_QUEUE') && (
                    <Button 
                      danger
                      size="large"
                      onClick={cancelChargingRequest}
                      className="w-full"
                    >
                      取消排队
                    </Button>
                  )}
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

              <Card title="统计数据" className="shadow-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {userStats?.total.records || 0}
                    </div>
                    <div className="text-gray-600">充电次数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ¥{userStats?.total.fee?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-gray-600">总费用</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {userStats?.total.amount?.toFixed(1) || '0.0'}度
                    </div>
                    <div className="text-gray-600">总充电量</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      ¥{userStats?.monthly.fee?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-gray-600">本月费用</div>
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
                disabled={queueInfo !== null && queueInfo.status !== 'COMPLETED'}
              >
                立即申请充电
              </Button>
              {queueInfo && (queueInfo.status === 'WAITING' || queueInfo.status === 'IN_QUEUE') && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">您已有进行中的充电请求，请等待完成后再提交新的请求</p>
                </div>
              )}
            </div>
          </Card>
        );
      
      case 'queue':
        return (
          <Card title="排队状态" className="shadow-lg">
            {queueInfo ? (
              <div className="text-center py-12">
                <div className="mb-8">
                  <Badge count={queueInfo.position || 0} offset={[15, 0]} size="default">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full">
                      <UnorderedListOutlined className="text-4xl text-white" />
                    </div>
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">当前排队号码</h3>
                <div className="text-6xl font-bold text-blue-600 mb-6">{queueInfo.queueNumber}</div>
                <div className="space-y-2 text-lg">
                  <p className="text-gray-700">
                    充电模式: <span className="font-bold text-blue-500">
                      {queueInfo.chargingMode === 'FAST' ? '快充' : '慢充'}
                    </span>
                  </p>
                  {queueInfo.position !== undefined && (
                    <p className="text-gray-700">
                      前方还有 <span className="font-bold text-orange-500">{queueInfo.position - 1}</span> 辆车
                    </p>
                  )}
                  {queueInfo.estimatedTime && (
                    <p className="text-gray-700">
                      预计等待时间: <span className="font-bold text-blue-500">{queueInfo.estimatedTime}</span>
                    </p>
                  )}
                  {queueInfo.chargingPile && (
                    <p className="text-gray-700">
                      分配充电桩: <span className="font-bold text-green-500">{queueInfo.chargingPile.name}桩</span>
                    </p>
                  )}
                </div>
                <div className="mt-6">
                  <Badge 
                    status={queueInfo.status === 'CHARGING' ? 'processing' : 'warning'} 
                    text={
                      queueInfo.status === 'CHARGING' ? '充电中' : 
                      queueInfo.status === 'IN_QUEUE' ? '已分配充电桩' : '等候分配'
                    }
                    className="text-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">当前没有排队记录</div>
                <Button 
                  type="primary" 
                  className="mt-4"
                  onClick={() => setChargingRequestVisible(true)}
                >
                  申请充电
                </Button>
              </div>
            )}
          </Card>
        );
      
      case 'records':
        return (
          <Card title="充电记录" className="shadow-lg">
            <Table 
              columns={recordColumns} 
              dataSource={chargingRecords} 
              loading={recordsLoading}
              rowKey="id"
              scroll={{ x: 1000 }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                onChange: (page, pageSize) => {
                  loadChargingRecords(page, pageSize);
                }
              }}
              className="rounded-lg"
            />
          </Card>
        );
      
      default:
        return null;
    }
  };

  const ChargingRequestModal = () => (
    <Modal
      title="充电请求"
      open={chargingRequestVisible}
      onCancel={() => setChargingRequestVisible(false)}
      footer={null}
      width={600}
    >
      <Form
        layout="vertical"
        onFinish={onSubmitChargingRequest}
        initialValues={{
          batteryCapacity: 60,
          requestedAmount: 30,
          chargingMode: 'FAST'
        }}
      >
        <Form.Item
          label="电池总容量 (kWh)"
          name="batteryCapacity"
          rules={[
            { required: true, message: '请输入电池总容量' },
            { type: 'number', min: 10, max: 100, message: '电池容量应在10-100kWh之间' }
          ]}
        >
          <Input type="number" placeholder="请输入电池总容量" suffix="kWh" />
        </Form.Item>

        <Form.Item
          label="请求充电量 (kWh)"
          name="requestedAmount"
          rules={[
            { required: true, message: '请输入请求充电量' },
            { type: 'number', min: 1, max: 100, message: '充电量应在1-100kWh之间' }
          ]}
        >
          <Input type="number" placeholder="请输入需要充电的电量" suffix="kWh" />
        </Form.Item>

        <Form.Item
          label="充电模式"
          name="chargingMode"
          rules={[{ required: true, message: '请选择充电模式' }]}
        >
          <Select placeholder="请选择充电模式">
            <Option value="FAST">快充 (30kW)</Option>
            <Option value="SLOW">慢充 (7kW)</Option>
          </Select>
        </Form.Item>

        <Form.Item className="mb-0">
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setChargingRequestVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              提交请求
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );

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
          <div className="absolute bottom-4 left-4 right-4">
            <Card size="small" className="shadow-sm">
              <div className="flex items-center space-x-3">
                <Avatar icon={<UserOutlined />} className="bg-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    普通用户
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Sider>

      <Layout>
        <Header className="bg-white shadow-sm border-b border-gray-200 px-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-lg"
            />
            <h2 className="ml-4 text-xl font-semibold text-gray-800">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <Avatar icon={<UserOutlined />} size="small" className="bg-blue-500" />
                <span className="text-gray-700 font-medium">{user.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </Content>
      </Layout>

      <ChargingRequestModal />
    </Layout>
  );
};

export default UserDashboard; 