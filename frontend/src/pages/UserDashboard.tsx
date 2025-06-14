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
import { authService } from '../services/auth';
import { webSocketService } from '../services/websocket';
import VirtualTimeDisplay from '../components/VirtualTimeDisplay';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

interface QueueInfo {
  queueNumber?: string;
  position?: number;
  estimatedTime?: string;
  status?: string;
  chargingMode?: string;
  requestedAmount?: number;
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
  const [updateChargingRequestVisible, setUpdateChargingRequestVisible] = useState(false); // 新增状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  const navigate = useNavigate();
  const user = authService.getCurrentUser('USER');

  // 检查认证状态
  useEffect(() => {
    if (!authService.isAuthenticated('USER')) {
      navigate('/');
      return;
    }

    // 连接WebSocket
    if (user && !webSocketService.isSocketConnected()) {
      webSocketService.connect(user.id, user.role);
    }
  }, [navigate, user]);

  // WebSocket事件监听
  useEffect(() => {
    const handleQueueUpdate = (event: CustomEvent) => {
      console.log('队列状态更新:', event.detail);
      loadQueueStatus();
      // 同时更新统计数据，因为队列变化可能影响统计
      loadUserStats();
    };

    const handleChargingStart = (event: CustomEvent) => {
      console.log('充电开始:', event.detail);
      // 充电开始时刷新所有数据
      loadQueueStatus();
      loadUserStats();
      if (activeMenu === 'records') {
        loadChargingRecords();
      }
    };

    const handleChargingComplete = (event: CustomEvent) => {
      console.log('充电完成:', event.detail);
      // 充电完成时刷新所有数据
      loadQueueStatus();
      loadUserStats();
      if (activeMenu === 'records') {
        loadChargingRecords();
      }
    };

    window.addEventListener('queueUpdate', handleQueueUpdate as EventListener);
    window.addEventListener('chargingStart', handleChargingStart as EventListener);
    window.addEventListener('chargingComplete', handleChargingComplete as EventListener);

    return () => {
      window.removeEventListener('queueUpdate', handleQueueUpdate as EventListener);
      window.removeEventListener('chargingStart', handleChargingStart as EventListener);
      window.removeEventListener('chargingComplete', handleChargingComplete as EventListener);
    };
  }, [activeMenu]);

  // 页面加载时获取数据
  useEffect(() => {
    loadInitialData();
    // 设置定时刷新队列状态，频率适中
    const interval = setInterval(() => {
      loadQueueStatus();
      // 如果在概览面板，也刷新统计数据
      if (activeMenu === 'dashboard') {
        loadUserStats();
      }
    }, 15000); // 每15秒刷新一次（减少频率，因为有WebSocket实时更新）

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
      case 'charging':
        loadQueueStatus(); // 充电服务页面也需要队列状态
        break;
    }
  }, [activeMenu]);

  // 加载初始数据
  const loadInitialData = async () => {
    try {
      // 并行加载数据以提高性能
      await Promise.all([
        loadUserStats(),
        loadQueueStatus()
      ]);
    } catch (error) {
      console.error('加载初始数据失败:', error);
    }
  };

  // 加载用户统计数据
  const loadUserStats = async () => {
    try {
      const response = await userAPI.getStatistics();
      const stats = apiUtils.handleResponse<UserStats>(response);
      setUserStats(stats);
    } catch (error) {
      console.error('获取用户统计失败:', error);
      // 不显示错误消息，避免干扰用户体验
    }
  };

  // 加载排队状态
  const loadQueueStatus = async () => {
    try {
      const response = await chargingAPI.getQueueStatus();
      const queueData = apiUtils.handleResponse<QueueInfo | null>(response);
      setQueueInfo(queueData);
      console.log('loadQueueStatus: queueData received:', queueData);
    } catch (error) {
      console.error('获取排队状态失败:', error);
      // 不显示错误消息，避免干扰用户体验
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
        // 断开WebSocket连接
        webSocketService.disconnect();
        
        // 使用新的认证服务退出
        authService.logout('USER');
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
      
      apiUtils.handleResponse(response);
      message.success('充电请求已提交，请等待调度');
      setChargingRequestVisible(false);
      
      // 立即刷新所有相关数据，确保一致性
      await Promise.all([
        loadQueueStatus(),
        loadUserStats()
      ]);
      
      // 如果当前在充电记录页面，也刷新记录
      if (activeMenu === 'records') {
        loadChargingRecords();
      }
    } catch (error) {
      message.error(apiUtils.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  // 取消充电请求
  const cancelChargingRequest = async () => {
    console.log('cancelChargingRequest 被调用, queueInfo:', queueInfo);
    
    if (!queueInfo?.queueNumber) {
      message.error('没有可取消的充电请求');
      return;
    }
    
    console.log('开始执行取消操作');
    setLoading(true);
    const loadingText = queueInfo.status === 'CHARGING' ? '正在停止充电...' : '正在取消充电请求...';
    const loadingMessage = message.loading(loadingText, 0);
    
    try {
      console.log('开始调用 cancelRequest API, queueNumber:', queueInfo.queueNumber);
      const response = await chargingAPI.cancelRequest(queueInfo.queueNumber!);
      console.log('cancelRequest API 响应:', response);
      
      loadingMessage();
      
      const successText = queueInfo.status === 'CHARGING' ? '充电已停止' : '充电请求已取消';
      message.success(successText);
      
      // 清空队列信息状态
      setQueueInfo(null);
      
      // 延迟刷新数据，确保后端状态已更新
      setTimeout(async () => {
        console.log('开始刷新数据...');
        await Promise.all([
          loadQueueStatus(),
          loadUserStats()
        ]);
        
        // 如果当前在充电记录页面，也刷新记录
        if (activeMenu === 'records') {
          loadChargingRecords();
        }
        console.log('数据刷新完成');
      }, 500);
      
    } catch (error) {
      loadingMessage();
      console.error('取消充电请求失败:', error);
      console.error('错误详情:', JSON.stringify(error, null, 2));
      message.error(apiUtils.handleError(error));
      
      // 发生错误时重新加载状态
      await loadQueueStatus();
    } finally {
      setLoading(false);
      console.log('取消充电操作完成，loading状态已重置');
    }
  };

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
      dataIndex: 'actualAmount', 
      key: 'actualAmount',
      width: 100,
      render: (value: number) => `${value}度`
    },
    { 
      title: '开始时间', 
      dataIndex: 'startTime', 
      key: 'startTime',
      width: 150,
      render: (value: string) => new Date(value).toLocaleString()
    },
    { 
      title: '结束时间', 
      dataIndex: 'endTime', 
      key: 'endTime',
      width: 150,
      render: (value: string) => value ? new Date(value).toLocaleString() : '-'
    },
    { 
      title: '总费用(元)', 
      dataIndex: 'totalFee', 
      key: 'totalFee',
      width: 100,
      render: (value: number) => (
        <span className="font-semibold text-green-600">¥{value.toFixed(2)}</span>
      )
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      width: 80,
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

            {/* 虚拟时间显示 */}
            <div className="grid grid-cols-1 gap-6">
              <VirtualTimeDisplay />
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
                      loading={loading}
                    >
                      取消排队
                    </Button>
                  )}
                  {queueInfo && queueInfo.status === 'CHARGING' && (
                    <Button 
                      danger
                      size="large"
                      onClick={cancelChargingRequest}
                      className="w-full"
                      loading={loading}
                    >
                      停止充电
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
              {queueInfo && (queueInfo.status === 'WAITING' || queueInfo.status === 'IN_QUEUE' || queueInfo.status === 'CHARGING') && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 mb-3">
                      您已有进行中的充电请求（{queueInfo.queueNumber}）
                      {queueInfo.status === 'CHARGING' ? '，正在充电中' : '，排队等待中'}
                    </p>
                    <div className="flex justify-center space-x-4">
                      {(queueInfo.status === 'WAITING' || queueInfo.status === 'IN_QUEUE') && (
                        <>
                          <Button 
                            type="primary" 
                            size="small"
                            onClick={() => setUpdateChargingRequestVisible(true)}
                          >
                            修改请求
                          </Button>
                          <Button 
                            danger 
                            size="small"
                            onClick={cancelChargingRequest}
                            loading={loading}
                          >
                            取消排队
                          </Button>
                        </>
                      )}
                      {queueInfo.status === 'CHARGING' && (
                        <Button 
                          danger 
                          size="small"
                          onClick={cancelChargingRequest}
                          loading={loading}
                        >
                          停止充电
                        </Button>
                      )}
                    </div>
                  </div>
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
                {/* 操作按钮 */}
                {(queueInfo.status === 'WAITING' || queueInfo.status === 'IN_QUEUE' || queueInfo.status === 'CHARGING') && (
                  <div className="mt-8 space-x-4">
                    {(queueInfo.status === 'WAITING' || queueInfo.status === 'IN_QUEUE') && (
                      <>
                        <Button 
                          type="primary" 
                          onClick={() => setUpdateChargingRequestVisible(true)}
                          disabled={loading}
                        >
                          修改请求
                        </Button>
                        <Button 
                          danger 
                          onClick={cancelChargingRequest}
                          loading={loading}
                        >
                          取消请求
                        </Button>
                      </>
                    )}
                    {queueInfo.status === 'CHARGING' && (
                      <Button 
                        danger 
                        onClick={cancelChargingRequest}
                        loading={loading}
                        size="large"
                      >
                        停止充电
                      </Button>
                    )}
                  </div>
                )}
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

  const onUpdateChargingRequest = async (values: any) => {
    if (!queueInfo?.queueNumber) {
      message.error('当前没有进行中的充电请求');
      return;
    }

    setLoading(true);
    try {
      const response = await chargingAPI.updateChargingRequest(
        queueInfo.queueNumber!,
        {
          requestedAmount: values.requestedAmount,
          chargingMode: values.chargingMode
        }
      );
      apiUtils.handleResponse(response);
      message.success('充电请求已修改');
      setUpdateChargingRequestVisible(false);
      await Promise.all([
        loadQueueStatus(),
        loadUserStats()
      ]);
    } catch (error) {
      message.error(apiUtils.handleError(error));
    } finally {
      setLoading(false);
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

  const UpdateChargingRequestModal = () => (
    <Modal
      title="修改充电请求"
      open={updateChargingRequestVisible}
      onCancel={() => setUpdateChargingRequestVisible(false)}
      footer={null}
      width={600}
    >
      <Form
        layout="vertical"
        onFinish={onUpdateChargingRequest}
        initialValues={{
          requestedAmount: queueInfo?.requestedAmount,
          chargingMode: queueInfo?.chargingMode
        }}
      >
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
            <Button onClick={() => setUpdateChargingRequestVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              提交修改
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
        {!collapsed && user && (
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
            <span className="text-gray-600">欢迎您，{user?.username || '用户'}</span>
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

        <Content className="p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </Content>
      </Layout>

      <ChargingRequestModal />
      <UpdateChargingRequestModal />
    </Layout>
  );
};

export default UserDashboard;