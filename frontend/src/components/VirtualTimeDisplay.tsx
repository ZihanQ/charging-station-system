import React, { useState, useEffect } from 'react';
import { Card, Tag, Typography, Space, Statistic } from 'antd';
import { ClockCircleOutlined, ThunderboltOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../services/api';

const { Text } = Typography;

interface VirtualTimeStatus {
  isVirtualMode: boolean;
  currentTime: string;
  realTime: string;
  accelerationRate: number;
  isPaused: boolean;
  timeSegment: 'PEAK' | 'NORMAL' | 'VALLEY';
  electricityPrice: number;
}

const VirtualTimeDisplay: React.FC = () => {
  const [status, setStatus] = useState<VirtualTimeStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取虚拟时间状态
  const fetchStatus = async () => {
    try {
      const response = await apiClient.get('/virtual-time/status');
      if (response.data.success) {
        setStatus(response.data.data);
      }
    } catch (error) {
      console.error('获取虚拟时间状态失败:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // 每5秒更新一次状态
    const interval = setInterval(fetchStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // 获取时间段显示文本和颜色
  const getTimeSegmentInfo = (segment: string) => {
    switch (segment) {
      case 'PEAK':
        return { text: '峰时', color: 'red' };
      case 'NORMAL':
        return { text: '平时', color: 'orange' };
      case 'VALLEY':
        return { text: '谷时', color: 'green' };
      default:
        return { text: '未知', color: 'default' };
    }
  };

  if (!status) {
    return null;
  }

  const timeSegmentInfo = getTimeSegmentInfo(status.timeSegment);

  return (
    <Card 
      title={
        <Space>
          <ClockCircleOutlined />
          <span>系统时间</span>
          {status.isVirtualMode && (
            <Tag color="blue" icon={<InfoCircleOutlined />}>
              虚拟时间模式
            </Tag>
          )}
        </Space>
      }
      className="shadow-lg border-l-4 border-l-blue-500"
      size="small"
    >
      <div className="space-y-4">
        {/* 当前时间显示 */}
        <div className="flex items-center justify-between">
          <div>
            <Text strong className="text-lg">
              {dayjs(status.currentTime).format('YYYY-MM-DD HH:mm:ss')}
            </Text>
            <br />
            <Text type="secondary" className="text-sm">
              {status.isVirtualMode ? '虚拟时间' : '真实时间'}
            </Text>
          </div>
          
          {status.isVirtualMode && (
            <div className="text-right">
              <div className="text-sm text-gray-500">
                加速倍率: {status.accelerationRate}x
              </div>
              {status.isPaused && (
                <Tag color="orange" className="mt-1">已暂停</Tag>
              )}
            </div>
          )}
        </div>

        {/* 电价信息 */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Tag color={timeSegmentInfo.color} className="mb-1">
                {timeSegmentInfo.text}
              </Tag>
            </div>
            <Text type="secondary" className="text-xs">当前时段</Text>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <ThunderboltOutlined className="text-yellow-500" />
              <Text strong className="text-lg">
                ¥{status.electricityPrice.toFixed(1)}
              </Text>
            </div>
            <Text type="secondary" className="text-xs">电价/度</Text>
          </div>
        </div>

        {/* 电价说明 */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <Tag color="red">峰时</Tag>
              <div>10:00-15:00</div>
              <div>18:00-21:00</div>
              <div>¥1.0/度</div>
            </div>
            <div>
              <Tag color="orange">平时</Tag>
              <div>07:00-10:00</div>
              <div>15:00-18:00</div>
              <div>21:00-23:00</div>
              <div>¥0.7/度</div>
            </div>
            <div>
              <Tag color="green">谷时</Tag>
              <div>23:00-07:00</div>
              <div>¥0.4/度</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VirtualTimeDisplay; 