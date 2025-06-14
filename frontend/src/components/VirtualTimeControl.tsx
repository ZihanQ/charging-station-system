import React, { useState, useEffect } from 'react';
import { Card, Form, Button, DatePicker, InputNumber, Switch, message, Space, Statistic, Typography, Alert } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ClockCircleOutlined, FastForwardOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const { Title, Text } = Typography;

interface VirtualTimeStatus {
  isVirtualMode: boolean;
  currentTime: string;
  accelerationRate: number;
  isPaused: boolean;
  timeSegment: string;
  electricityPrice: number;
}

const VirtualTimeControl: React.FC = () => {
  const [form] = Form.useForm();
  const [status, setStatus] = useState<VirtualTimeStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取虚拟时间状态
  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/virtual-time/status');
      if (response.data.success) {
        setStatus(response.data.data);
      }
    } catch (error) {
      console.error('获取虚拟时间状态失败:', error);
    }
  };

  // 设置虚拟时间
  const setVirtualTime = async (values: any) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/virtual-time/set', {
        time: values.time.toDate()
      });
      
      if (response.data.success) {
        message.success('虚拟时间设置成功');
        fetchStatus();
      } else {
        message.error(response.data.message || '设置失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '设置虚拟时间失败');
    }
    setLoading(false);
  };

  // 设置时间加速倍率
  const setAccelerationRate = async (rate: number) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/virtual-time/acceleration', {
        rate
      });
      
      if (response.data.success) {
        message.success(`时间加速倍率已设置为 ${rate}x`);
        fetchStatus();
      } else {
        message.error(response.data.message || '设置失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '设置时间加速倍率失败');
    }
    setLoading(false);
  };

  // 暂停/恢复虚拟时间
  const togglePause = async () => {
    setLoading(true);
    try {
      const endpoint = status?.isPaused ? '/api/virtual-time/resume' : '/api/virtual-time/pause';
      const response = await axios.post(endpoint);
      
      if (response.data.success) {
        message.success(response.data.message);
        fetchStatus();
      } else {
        message.error(response.data.message || '操作失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
    setLoading(false);
  };

  // 关闭虚拟时间模式
  const disableVirtualMode = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/virtual-time/disable');
      
      if (response.data.success) {
        message.success('已切换到真实时间模式');
        fetchStatus();
      } else {
        message.error(response.data.message || '操作失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
    setLoading(false);
  };

  // 快捷设置时间
  const setQuickTime = (hour: number) => {
    const now = dayjs();
    const targetTime = now.hour(hour).minute(0).second(0);
    form.setFieldsValue({ time: targetTime });
  };

  useEffect(() => {
    fetchStatus();
    // 每5秒更新一次状态
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <Card 
        title={<span><ClockCircleOutlined className="mr-2" />虚拟时间控制</span>}
        extra={
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            onClick={fetchStatus}
            size="small"
          >
            刷新状态
          </Button>
        }
      >
        {/* 当前状态显示 */}
        {status && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Statistic 
                title="当前时间"
                value={dayjs(status.currentTime).format('YYYY-MM-DD HH:mm:ss')}
              />
              <Statistic 
                title="时间段"
                value={status.timeSegment}
                valueStyle={{ color: getTimeSegmentColor(status.timeSegment) }}
              />
              <Statistic 
                title="电价"
                value={status.electricityPrice}
                suffix="元/度"
                precision={1}
                valueStyle={{ color: getPriceColor(status.electricityPrice) }}
              />
              <Statistic 
                title="加速倍率"
                value={status.accelerationRate}
                suffix="x"
                valueStyle={{ color: status.accelerationRate > 1 ? '#1890ff' : '#52c41a' }}
              />
            </div>

            <Alert 
              message={status.isVirtualMode ? '虚拟时间模式已启用' : '当前使用真实时间'}
              type={status.isVirtualMode ? 'info' : 'warning'}
              showIcon
              className="mb-4"
            />

            {status.isVirtualMode && (
              <Space>
                <Button 
                  type={status.isPaused ? 'primary' : 'default'}
                  icon={status.isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  onClick={togglePause}
                  loading={loading}
                >
                  {status.isPaused ? '恢复' : '暂停'}
                </Button>
                <Button 
                  danger
                  onClick={disableVirtualMode}
                  loading={loading}
                >
                  切换到真实时间
                </Button>
              </Space>
            )}
          </div>
        )}

        {/* 设置虚拟时间 */}
        <Form
          form={form}
          layout="vertical"
          onFinish={setVirtualTime}
          initialValues={{
            time: dayjs(),
            accelerationRate: 1
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="设置虚拟时间"
              name="time"
              rules={[{ required: true, message: '请选择时间' }]}
            >
              <DatePicker 
                showTime 
                format="YYYY-MM-DD HH:mm:ss"
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              label="时间加速倍率"
              name="accelerationRate"
              tooltip="1表示正常速度，2表示2倍速，0.5表示0.5倍速"
            >
              <InputNumber 
                min={0.1} 
                max={100} 
                step={0.1}
                className="w-full"
                addonAfter="x"
              />
            </Form.Item>
          </div>

          {/* 快捷时间设置 */}
          <div className="mb-4">
            <Text strong className="block mb-2">快捷时间设置：</Text>
            <Space wrap>
              <Button size="small" onClick={() => setQuickTime(6)}>
                6:00 (谷时)
              </Button>
              <Button size="small" onClick={() => setQuickTime(8)}>
                8:00 (平时)
              </Button>
              <Button size="small" onClick={() => setQuickTime(12)}>
                12:00 (峰时)
              </Button>
              <Button size="small" onClick={() => setQuickTime(16)}>
                16:00 (平时)
              </Button>
              <Button size="small" onClick={() => setQuickTime(19)}>
                19:00 (峰时)
              </Button>
              <Button size="small" onClick={() => setQuickTime(23)}>
                23:00 (谷时)
              </Button>
            </Space>
          </div>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<ClockCircleOutlined />}
              >
                设置虚拟时间
              </Button>
              <Button 
                icon={<FastForwardOutlined />}
                onClick={() => {
                  const rate = form.getFieldValue('accelerationRate');
                  if (rate) {
                    setAccelerationRate(rate);
                  }
                }}
                loading={loading}
              >
                设置加速倍率
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* 快捷加速倍率设置 */}
        <div>
          <Text strong className="block mb-2">快捷加速倍率：</Text>
          <Space wrap>
            <Button size="small" onClick={() => setAccelerationRate(1)}>
              1x (正常)
            </Button>
            <Button size="small" onClick={() => setAccelerationRate(5)}>
              5x
            </Button>
            <Button size="small" onClick={() => setAccelerationRate(10)}>
              10x
            </Button>
            <Button size="small" onClick={() => setAccelerationRate(60)}>
              60x (1分钟=1小时)
            </Button>
            <Button size="small" onClick={() => setAccelerationRate(3600)}>
              3600x (1秒=1小时)
            </Button>
          </Space>
        </div>
      </Card>

      {/* 电价时段说明 */}
      <Card title="电价时段说明" size="small">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-red-50 rounded">
            <Text strong style={{ color: '#ff4d4f' }}>峰时 (1.0元/度)</Text>
            <br />
            10:00-15:00, 18:00-21:00
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded">
            <Text strong style={{ color: '#faad14' }}>平时 (0.7元/度)</Text>
            <br />
            7:00-10:00, 15:00-18:00, 21:00-23:00
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <Text strong style={{ color: '#52c41a' }}>谷时 (0.4元/度)</Text>
            <br />
            23:00-次日7:00
          </div>
        </div>
      </Card>
    </div>
  );
};

// 获取时间段颜色
const getTimeSegmentColor = (segment: string) => {
  switch (segment) {
    case '峰时':
      return '#ff4d4f';
    case '平时':
      return '#faad14';
    case '谷时':
      return '#52c41a';
    default:
      return '#666';
  }
};

// 获取电价颜色
const getPriceColor = (price: number) => {
  if (price >= 1.0) return '#ff4d4f';
  if (price >= 0.7) return '#faad14';
  return '#52c41a';
};

export default VirtualTimeControl; 