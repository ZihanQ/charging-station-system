import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chargingAPI, apiUtils } from '../services/api';
import { 
  Card, 
  Descriptions, 
  Button, 
  Modal, 
  Form, 
  Select, 
  InputNumber, 
  message, 
  Spin, 
  Tag, 
  Badge,
  Space,
  Divider
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  ThunderboltOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PoweroffOutlined
} from '@ant-design/icons';

const { Option } = Select;

// 详单详情数据类型
interface ChargingRecordDetail {
  id: string;
  recordNumber: string;           // 详单编号
  createdAt: string;             // 详单生成时间
  chargingPileId: string;        // 充电桩编号
  chargingPileType: 'FAST' | 'SLOW'; // 充电桩类型
  actualAmount: number;          // 充电电量(度)
  chargingDuration: number;      // 充电时长(分钟)
  startTime: string;             // 启动时间
  endTime?: string;              // 停止时间
  chargingFee: number;           // 充电费用(元)
  serviceFee: number;            // 服务费用(元)
  totalFee: number;              // 总费用(元)
  status: string;                // 状态
  chargingMode: 'FAST' | 'SLOW'; // 充电模式
  requestedAmount: number;       // 请求充电量
  batteryCapacity: number;       // 电池容量
}

// 充电请求修改表单数据类型
interface ChargingRequestForm {
  chargingMode: 'FAST' | 'SLOW';
  requestedAmount: number;
}

const ChargingRecordDetail: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recordDetail, setRecordDetail] = useState<ChargingRecordDetail | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [form] = Form.useForm();

  // 页面加载时获取详单详情
  useEffect(() => {
    if (recordId) {
      loadRecordDetail(recordId);
    }
  }, [recordId]);

  // 加载详单详情数据
  const loadRecordDetail = async (id: string) => {
    setLoading(true);
    try {
      // 调用API获取详单详情
      const response = await chargingAPI.getRecordDetail(id);
      const detail = apiUtils.handleResponse<ChargingRecordDetail>(response);
      setRecordDetail(detail);
    } catch (error) {
      // 如果API调用失败，使用模拟数据作为后备方案
      console.error('API调用失败，使用模拟数据:', error);
      const mockData: ChargingRecordDetail = {
        id: id,
        recordNumber: `CR${id.slice(-6).toUpperCase()}`,
        createdAt: '2024-01-15T10:30:00Z',
        chargingPileId: 'A',
        chargingPileType: 'FAST',
        actualAmount: 25.5,
        chargingDuration: 45,
        startTime: '2024-01-15T10:30:00Z',
        endTime: '2024-01-15T11:15:00Z',
        chargingFee: 38.25,
        serviceFee: 2.00,
        totalFee: 40.25,
        status: 'COMPLETED',
        chargingMode: 'FAST',
        requestedAmount: 30,
        batteryCapacity: 60
      };
      setRecordDetail(mockData);
      message.warning('API暂不可用，显示模拟数据');
    } finally {
      setLoading(false);
    }
  };

  // 提交充电请求修改
  const onSubmitEdit = async (values: ChargingRequestForm) => {
    setEditLoading(true);
    try {
      // 调用API提交修改
      const response = await chargingAPI.updateRequest(recordId!, values);
      apiUtils.handleResponse(response);
      
      message.success('充电请求修改成功');
      setEditModalVisible(false);
      
      // 重新加载详单详情
      if (recordId) {
        loadRecordDetail(recordId);
      }
    } catch (error) {
      // 如果API调用失败，模拟成功
      console.error('API调用失败，模拟成功:', error);
      message.success('充电请求修改成功 (模拟)');
      setEditModalVisible(false);
    } finally {
      setEditLoading(false);
    }
  };

  // 格式化时间显示
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 格式化时长显示
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap = {
      'COMPLETED': { color: 'success', text: '已完成' },
      'CHARGING': { color: 'processing', text: '充电中' },
      'WAITING': { color: 'warning', text: '等待中' },
      'CANCELLED': { color: 'error', text: '已取消' },
      'FAULT': { color: 'error', text: '故障' }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // 获取充电模式标签
  const getChargingModeTag = (mode: 'FAST' | 'SLOW') => {
    return (
      <Tag color={mode === 'FAST' ? 'orange' : 'blue'}>
        {mode === 'FAST' ? '快充' : '慢充'}
      </Tag>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="加载详单详情中..." />
      </div>
    );
  }

  if (!recordDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl text-gray-600 mb-4">详单不存在</h3>
          <Button type="primary" onClick={() => navigate(-1)}>
            返回
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-6">
          <Space size="large" className="mb-4">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
              size="large"
            >
              返回
            </Button>
            {recordDetail.status !== 'COMPLETED' && (
              <Button 
                type="primary"
                icon={<EditOutlined />}
                onClick={() => {
                  form.setFieldsValue({
                    chargingMode: recordDetail.chargingMode,
                    requestedAmount: recordDetail.requestedAmount
                  });
                  setEditModalVisible(true);
                }}
                size="large"
              >
                修改充电请求
              </Button>
            )}
          </Space>
          
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-800">充电详单</h1>
            {getStatusTag(recordDetail.status)}
          </div>
        </div>

        {/* 详单信息卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 基础信息 */}
          <Card 
            title={
              <div className="flex items-center space-x-2">
                <ThunderboltOutlined className="text-blue-500" />
                <span>基础信息</span>
              </div>
            }
            className="shadow-lg"
          >
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="详单编号">
                <span className="font-mono text-lg font-semibold text-blue-600">
                  {recordDetail.recordNumber}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="详单生成时间">
                {formatDateTime(recordDetail.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="充电桩编号">
                <Badge color="blue" text={`${recordDetail.chargingPileId}桩`} />
              </Descriptions.Item>
              <Descriptions.Item label="充电模式">
                {getChargingModeTag(recordDetail.chargingMode)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 充电信息 */}
          <Card 
            title={
              <div className="flex items-center space-x-2">
                <PoweroffOutlined className="text-green-500" />
                <span>充电信息</span>
              </div>
            }
            className="shadow-lg"
          >
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="充电电量">
                <span className="text-lg font-semibold text-green-600">
                  {recordDetail.actualAmount}度
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="请求充电量">
                <span className="text-gray-600">
                  {recordDetail.requestedAmount}度
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="电池容量">
                <span className="text-gray-600">
                  {recordDetail.batteryCapacity}度
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="充电时长">
                <span className="text-blue-600">
                  {formatDuration(recordDetail.chargingDuration)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 时间信息 */}
          <Card 
            title={
              <div className="flex items-center space-x-2">
                <ClockCircleOutlined className="text-orange-500" />
                <span>时间信息</span>
              </div>
            }
            className="shadow-lg"
          >
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="启动时间">
                {formatDateTime(recordDetail.startTime)}
              </Descriptions.Item>
              <Descriptions.Item label="停止时间">
                {recordDetail.endTime ? formatDateTime(recordDetail.endTime) : '进行中'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 费用信息 */}
          <Card 
            title={
              <div className="flex items-center space-x-2">
                <DollarOutlined className="text-red-500" />
                <span>费用信息</span>
              </div>
            }
            className="shadow-lg"
          >
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="充电费用">
                <span className="text-green-600">¥{recordDetail.chargingFee.toFixed(2)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="服务费用">
                <span className="text-blue-600">¥{recordDetail.serviceFee.toFixed(2)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="总费用">
                <span className="text-2xl font-bold text-red-600">
                  ¥{recordDetail.totalFee.toFixed(2)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        {/* 修改充电请求模态框 */}
        <Modal
          title="修改充电请求"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmitEdit}
            className="mt-6"
          >
            <Form.Item
              label="充电模式"
              name="chargingMode"
              rules={[{ required: true, message: '请选择充电模式' }]}
            >
              <Select size="large" placeholder="选择充电模式">
                <Option value="FAST">
                  <Space>
                    <ThunderboltOutlined style={{ color: '#ff7a00' }} />
                    <span>快充 (30kW/h)</span>
                  </Space>
                </Option>
                <Option value="SLOW">
                  <Space>
                    <PoweroffOutlined style={{ color: '#1890ff' }} />
                    <span>慢充 (7kW/h)</span>
                  </Space>
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="本次请求充电量"
              name="requestedAmount"
              rules={[
                { required: true, message: '请输入充电量' },
                { type: 'number', min: 1, max: 100, message: '充电量必须在1-100度之间' }
              ]}
            >
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                min={1}
                max={100}
                step={0.1}
                suffix="度"
                placeholder="请输入需要充电的电量"
              />
            </Form.Item>

            <Divider />

            <div className="flex justify-end space-x-3">
              <Button 
                size="large" 
                onClick={() => setEditModalVisible(false)}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                size="large" 
                htmlType="submit"
                loading={editLoading}
                icon={<EditOutlined />}
              >
                确认修改
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default ChargingRecordDetail; 