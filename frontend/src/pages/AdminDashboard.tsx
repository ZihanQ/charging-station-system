import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Button, message, Table, Tag, Statistic, Row, Col, Avatar, Dropdown, Modal, Spin, Badge } from 'antd';
import { 
  DashboardOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminAPI, apiUtils } from '../services/api';
import { authService } from '../services/auth';
import { webSocketService } from '../services/websocket';

const { Header, Sider, Content } = Layout;

interface DashboardData {
  totalUsers: number;
  totalChargingPiles: number;
  normalPiles: number;
  currentQueue: number;
  faultPiles: number;
  todayRevenue: number;
  todayChargingCount: number;
  todayPowerConsumption: number;
}

interface ChargingPile {
  id: string;
  name: string;
  type: string;
  power: number;
  status: string;
  position: number;
  currentUser?: string;
  progress?: number;
  queueCount: number;
}

interface QueueRecord {
  id: string;
  queueNumber: string;
  username: string;
  chargingMode: string;
  requestedAmount: number;
  position: number;
  status: string;
  waitingTime: string;
  createdAt: string;
}

interface StatisticsData {
  today: {
    chargingCount: number;
    powerConsumption: number;
    revenue: number;
  };
  thisWeek: {
    chargingCount: number;
    powerConsumption: number;
    revenue: number;
  };
  thisMonth: {
    chargingCount: number;
    powerConsumption: number;
    revenue: number;
  };
}

const AdminDashboard: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [chargingPiles, setChargingPiles] = useState<ChargingPile[]>([]);
  const [queueRecords, setQueueRecords] = useState<QueueRecord[]>([]);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const navigate = useNavigate();

  const user = authService.getCurrentUser('ADMIN');

  // 检查认证状态
  useEffect(() => {
    if (!authService.isAuthenticated('ADMIN')) {
      navigate('/admin');
      return;
    }

    // 连接WebSocket
    if (user && !webSocketService.isSocketConnected()) {
      webSocketService.connect(user.id, user.role);
    }
  }, [navigate, user]);

  // WebSocket事件监听
  useEffect(() => {
    const handleNewQueueRequest = (event: CustomEvent) => {
      console.log('新的充电请求:', event.detail);
      message.info(`新的充电请求：用户 ${event.detail.username || '未知用户'}`);
      fetchDashboardData();
      if (activeMenu === 'queue') {
        fetchQueueRecords();
      }
    };

    const handleQueueUpdate = (event: CustomEvent) => {
      console.log('队列状态更新:', event.detail);
      fetchDashboardData();
      if (activeMenu === 'queue') {
        fetchQueueRecords();
      }
    };

    const handlePileStatusUpdate = (event: CustomEvent) => {
      console.log('充电桩状态更新:', event.detail);
      fetchDashboardData();
      if (activeMenu === 'piles') {
        fetchChargingPiles();
      }
    };

    window.addEventListener('newQueueRequest', handleNewQueueRequest as EventListener);
    window.addEventListener('queueUpdate', handleQueueUpdate as EventListener);
    window.addEventListener('pileStatusUpdate', handlePileStatusUpdate as EventListener);

    return () => {
      window.removeEventListener('newQueueRequest', handleNewQueueRequest as EventListener);
      window.removeEventListener('queueUpdate', handleQueueUpdate as EventListener);
      window.removeEventListener('pileStatusUpdate', handlePileStatusUpdate as EventListener);
    };
  }, [activeMenu]);

  // 获取仪表板数据
  const fetchDashboardData = async () => {
    try {
      setLoading(activeMenu === 'dashboard');
      const response = await adminAPI.getDashboard();
      const data = apiUtils.handleResponse<DashboardData>(response);
      setDashboardData(data);
    } catch (error) {
      const errorMessage = apiUtils.handleError(error);
      console.error('获取仪表板数据失败:', errorMessage);
      if (activeMenu === 'dashboard') {
        message.error('获取仪表板数据失败: ' + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // 获取充电桩数据
  const fetchChargingPiles = async () => {
    try {
      setLoading(activeMenu === 'piles');
      const response = await adminAPI.getPiles();
      const data = apiUtils.handleResponse<ChargingPile[]>(response);
      setChargingPiles(data);
    } catch (error) {
      const errorMessage = apiUtils.handleError(error);
      console.error('获取充电桩数据失败:', errorMessage);
      if (activeMenu === 'piles') {
        message.error('获取充电桩数据失败: ' + errorMessage);
      }
    } finally {
      if (activeMenu === 'piles') {
        setLoading(false);
      }
    }
  };

  // 获取排队数据
  const fetchQueueRecords = async () => {
    try {
      setLoading(activeMenu === 'queue');
      const response = await adminAPI.getQueueManagement();
      const data = apiUtils.handleResponse<QueueRecord[]>(response);
      setQueueRecords(data);
    } catch (error) {
      const errorMessage = apiUtils.handleError(error);
      console.error('获取排队数据失败:', errorMessage);
      if (activeMenu === 'queue') {
        message.error('获取排队数据失败: ' + errorMessage);
      }
    } finally {
      if (activeMenu === 'queue') {
        setLoading(false);
      }
    }
  };

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      setLoading(activeMenu === 'reports');
      const response = await adminAPI.getStatistics();
      const data = apiUtils.handleResponse<StatisticsData>(response);
      setStatisticsData(data);
    } catch (error) {
      const errorMessage = apiUtils.handleError(error);
      console.error('获取统计数据失败:', errorMessage);
      if (activeMenu === 'reports') {
        message.error('获取统计数据失败: ' + errorMessage);
      }
    } finally {
      if (activeMenu === 'reports') {
        setLoading(false);
      }
    }
  };

  // 更新充电桩状态
  const updatePileStatus = async (pileId: string, status: string) => {
    try {
      await adminAPI.updatePileStatus(pileId, status);
      message.success('充电桩状态更新成功');
      fetchChargingPiles();
    } catch (error) {
      const errorMessage = apiUtils.handleError(error);
      message.error('更新充电桩状态失败: ' + errorMessage);
    }
  };

  // 手动分配充电桩
  const assignChargingPile = async (queueId: string, pileId: string) => {
    try {
      await adminAPI.assignPile(queueId, pileId);
      message.success('充电桩分配成功');
      fetchQueueRecords();
      fetchChargingPiles();
    } catch (error) {
      const errorMessage = apiUtils.handleError(error);
      message.error('分配充电桩失败: ' + errorMessage);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // 设置定时刷新，确保能及时看到新的充电申请
    const interval = setInterval(() => {
      fetchDashboardData();
      // 如果在排队管理页面，也刷新排队数据
      if (activeMenu === 'queue') {
        fetchQueueRecords();
      }
    }, 10000); // 每10秒刷新一次

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeMenu === 'piles') {
      fetchChargingPiles();
    } else if (activeMenu === 'queue') {
      fetchQueueRecords();
    } else if (activeMenu === 'reports') {
      fetchStatistics();
    } else if (activeMenu === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeMenu]);

  const logout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '您确定要退出管理系统吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        // 断开WebSocket连接
        webSocketService.disconnect();
        
        // 使用新的认证服务退出
        authService.logout('ADMIN');
        message.success('已退出登录');
        navigate('/admin');
      }
    });
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return <Tag color="success" icon={<CheckCircleOutlined />}>正常运行</Tag>;
      case 'FAULT':
        return <Tag color="error" icon={<ExclamationCircleOutlined />}>故障维修</Tag>;
      case 'DISABLED':
        return <Tag color="default" icon={<StopOutlined />}>已关闭</Tag>;
      case 'CHARGING':
        return <Tag color="processing" icon={<ThunderboltOutlined />}>充电中</Tag>;
      default:
        return <Tag>未知状态</Tag>;
    }
  };

  const getQueueStatusTag = (status: string) => {
    switch (status) {
      case 'WAITING':
        return <Tag color="orange" icon={<ClockCircleOutlined />}>等待中</Tag>;
      case 'IN_QUEUE':
        return <Tag color="blue" icon={<UnorderedListOutlined />}>排队中</Tag>;
      case 'CHARGING':
        return <Tag color="green" icon={<ThunderboltOutlined />}>充电中</Tag>;
      case 'COMPLETED':
        return <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>;
      case 'CANCELLED':
        return <Tag color="default">已取消</Tag>;
      default:
        return <Tag>未知状态</Tag>;
    }
  };

  // 充电桩表格列定义
  const pileColumns = [
    { 
      title: '充电桩', 
      dataIndex: 'name', 
      key: 'name',
      width: 100,
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
        <Tag color={type === 'FAST' ? 'orange' : 'blue'}>
          {type === 'FAST' ? '快充' : '慢充'}
        </Tag>
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
      title: '排队数量', 
      dataIndex: 'queueCount', 
      key: 'queueCount',
      width: 100,
      render: (count: number) => (
        <Badge count={count} showZero color="#faad14" />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (record: ChargingPile) => (
        <div className="space-x-2">
          <Button
            size="small"
            type={record.status === 'NORMAL' ? 'default' : 'primary'}
            onClick={() => updatePileStatus(record.id, record.status === 'NORMAL' ? 'DISABLED' : 'NORMAL')}
          >
            {record.status === 'NORMAL' ? '关闭' : '启用'}
          </Button>
          {record.status === 'FAULT' && (
            <Button
              size="small"
              type="primary"
              onClick={() => updatePileStatus(record.id, 'NORMAL')}
            >
              修复完成
            </Button>
          )}
        </div>
      )
    }
  ];

  // 排队记录表格列定义
  const queueColumns = [
    {
      title: '排队号',
      dataIndex: 'queueNumber',
      key: 'queueNumber',
      width: 100
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 100
    },
    {
      title: '充电模式',
      dataIndex: 'chargingMode',
      key: 'chargingMode',
      width: 100,
      render: (mode: string) => (
        <Tag color={mode === 'FAST' ? 'orange' : 'blue'}>
          {mode === 'FAST' ? '快充' : '慢充'}
        </Tag>
      )
    },
    {
      title: '需求电量',
      dataIndex: 'requestedAmount',
      key: 'requestedAmount',
      width: 100,
      render: (amount: number) => `${amount}%`
    },
    {
      title: '队列位置',
      dataIndex: 'position',
      key: 'position',
      width: 100,
      render: (position: number) => `第${position}位`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getQueueStatusTag(status)
    },
    {
      title: '等待时间',
      dataIndex: 'waitingTime',
      key: 'waitingTime',
      width: 100
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (record: QueueRecord) => (
        record.status === 'WAITING' || record.status === 'IN_QUEUE' ? (
          <Dropdown
            menu={{
              items: chargingPiles
                .filter(pile => pile.status === 'NORMAL' && pile.queueCount === 0)
                .map(pile => ({
                  key: pile.id,
                  label: `分配到${pile.name}桩`,
                  onClick: () => assignChargingPile(record.id, pile.id)
                }))
            }}
            trigger={['click']}
          >
            <Button size="small" type="primary">
              手动分配
            </Button>
          </Dropdown>
        ) : null
      )
    }
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '系统概览'
    },
    {
      key: 'piles',
      icon: <ThunderboltOutlined />,
      label: '充电桩管理'
    },
    {
      key: 'queue',
      icon: <UnorderedListOutlined />,
      label: '排队管理'
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: '统计报告'
    }
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Spin size="large" tip="加载中..." />
        </div>
      );
    }

    switch (activeMenu) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">系统概览</h2>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchDashboardData}
                loading={loading}
              >
                刷新数据
              </Button>
            </div>
            
            <Row gutter={16}>
              <Col span={6}>
                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                  <Statistic
                    title="总充电桩数"
                    value={dashboardData?.totalChargingPiles || 0}
                    prefix={<div className="p-2 bg-green-100 rounded-full inline-flex"><ThunderboltOutlined className="text-green-600" /></div>}
                    valueStyle={{ color: '#16a34a', fontSize: '2rem', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                  <Statistic
                    title="正常运行"
                    value={dashboardData?.normalPiles || 0}
                    prefix={<div className="p-2 bg-blue-100 rounded-full inline-flex"><CheckCircleOutlined className="text-blue-600" /></div>}
                    valueStyle={{ color: '#2563eb', fontSize: '2rem', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
                  <Statistic
                    title="当前排队"
                    value={dashboardData?.currentQueue || 0}
                    prefix={<div className="p-2 bg-orange-100 rounded-full inline-flex"><UnorderedListOutlined className="text-orange-600" /></div>}
                    valueStyle={{ color: '#ea580c', fontSize: '2rem', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500">
                  <Statistic
                    title="故障设备"
                    value={dashboardData?.faultPiles || 0}
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
                    dataSource={chargingPiles.slice(0, 5)} 
                    pagination={false}
                    size="middle"
                    className="rounded-lg"
                    rowKey="id"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card title="实时监控" className="shadow-lg">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600 mb-1">今日收入</div>
                      <div className="text-lg font-semibold text-green-800">
                        ¥{dashboardData?.todayRevenue?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600 mb-1">今日充电次数</div>
                      <div className="text-lg font-semibold text-blue-800">
                        {dashboardData?.todayChargingCount || 0} 次
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-600 mb-1">总用户数</div>
                      <div className="text-lg font-semibold text-purple-800">
                        {dashboardData?.totalUsers || 0} 人
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        );
      
      case 'piles':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">充电桩管理</h2>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchChargingPiles}
                loading={loading}
              >
                刷新数据
              </Button>
            </div>
            
            <Card className="shadow-lg">
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
                rowKey="id"
              />
            </Card>
          </div>
        );
      
      case 'queue':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">排队管理</h2>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchQueueRecords}
                loading={loading}
              >
                刷新数据
              </Button>
            </div>
            
            <Card className="shadow-lg">
              <Table 
                columns={queueColumns} 
                dataSource={queueRecords} 
                scroll={{ x: 800 }}
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
                }}
                className="rounded-lg"
                rowKey="id"
              />
            </Card>
          </div>
        );
      
      case 'reports':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">统计报告</h2>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchStatistics}
                loading={loading}
              >
                刷新数据
              </Button>
            </div>
            
            <Row gutter={16}>
              <Col span={8}>
                <Card title="今日统计" className="shadow-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>充电次数</span>
                      <span className="font-semibold text-blue-600">
                        {statisticsData?.today?.chargingCount || 0}次
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>总用电量</span>
                      <span className="font-semibold text-green-600">
                        {statisticsData?.today?.powerConsumption?.toFixed(1) || '0.0'}度
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>总收入</span>
                      <span className="font-semibold text-purple-600">
                        ¥{statisticsData?.today?.revenue?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="本周统计" className="shadow-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>充电次数</span>
                      <span className="font-semibold text-blue-600">
                        {statisticsData?.thisWeek?.chargingCount || 0}次
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>总用电量</span>
                      <span className="font-semibold text-green-600">
                        {statisticsData?.thisWeek?.powerConsumption?.toFixed(1) || '0.0'}度
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>总收入</span>
                      <span className="font-semibold text-purple-600">
                        ¥{statisticsData?.thisWeek?.revenue?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="本月统计" className="shadow-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>充电次数</span>
                      <span className="font-semibold text-blue-600">
                        {statisticsData?.thisMonth?.chargingCount || 0}次
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>总用电量</span>
                      <span className="font-semibold text-green-600">
                        {statisticsData?.thisMonth?.powerConsumption?.toFixed(1) || '0.0'}度
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>总收入</span>
                      <span className="font-semibold text-purple-600">
                        ¥{statisticsData?.thisMonth?.revenue?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (activeMenu) {
      case 'dashboard': return '系统概览';
      case 'piles': return '充电桩管理';
      case 'queue': return '排队管理';
      case 'reports': return '统计报告';
      default: return '充电桩管理系统';
    }
  };

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="shadow-lg"
        width={220}
      >
        <div className="h-16 flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600">
          {!collapsed ? (
            <div className="text-white font-bold text-lg">⚡ 充电桩管理</div>
          ) : (
            <div className="text-white text-2xl">⚡</div>
          )}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeMenu]}
          onClick={({ key }) => setActiveMenu(key)}
          items={menuItems}
          className="border-r-0"
        />
      </Sider>
      
      <Layout>
        <Header className="bg-white px-6 shadow-sm border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-lg"
            />
            <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">欢迎您，{user?.username || '管理员'}</span>
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Avatar 
                icon={<UserOutlined />} 
                className="bg-blue-500 cursor-pointer hover:bg-blue-600 transition-colors"
              />
            </Dropdown>
          </div>
        </Header>
        
        <Content className="m-6 p-6 bg-white rounded-lg shadow-sm min-h-[calc(100vh-8rem)]">
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard; 