import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import apiClient from '../services/api';

const { Text } = Typography;

interface VirtualTimeDisplayProps {
  onTimeUpdate?: (time: Date) => void;
}

interface VirtualTimeData {
  currentTime: string;
  timeSegment: string;
  electricityPrice: number;
}

const VirtualTimeDisplay: React.FC<VirtualTimeDisplayProps> = ({ onTimeUpdate }) => {
  const [virtualTimeData, setVirtualTimeData] = useState<VirtualTimeData | null>(null);

  const fetchVirtualTime = async () => {
    try {
      const response = await apiClient.get('/virtual-time/status');
      if (response.data.success) {
        const data = response.data.data;
        setVirtualTimeData({
          currentTime: new Date(data.currentTime).toLocaleString(),
          timeSegment: data.timeSegment,
          electricityPrice: data.electricityPrice
        });
        onTimeUpdate?.(new Date(data.currentTime));
      }
    } catch (error) {
      console.error('获取虚拟时间失败:', error);
    }
  };

  useEffect(() => {
    fetchVirtualTime();
    const interval = setInterval(fetchVirtualTime, 1000);
    return () => clearInterval(interval);
  }, [onTimeUpdate]);

  const getTimeSegmentColor = (segment: string) => {
    switch (segment) {
      case '峰时':
        return 'red';
      case '平时':
        return 'orange';
      case '谷时':
        return 'green';
      default:
        return 'blue';
    }
  };

  return (
    <Card title="虚拟时间" className="shadow-lg">
      <Space direction="vertical" size="middle" className="w-full">
        <div className="flex items-center justify-between">
          <Text strong>当前时间：</Text>
          <Text>{virtualTimeData?.currentTime}</Text>
        </div>
        <div className="flex items-center justify-between">
          <Text strong>时间段：</Text>
          <Tag color={getTimeSegmentColor(virtualTimeData?.timeSegment || '')}>
            {virtualTimeData?.timeSegment}
          </Tag>
        </div>
        <div className="flex items-center justify-between">
          <Text strong>当前电价：</Text>
          <Text className="text-lg font-semibold text-blue-600">
            ¥{virtualTimeData?.electricityPrice?.toFixed(2)}/度
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default VirtualTimeDisplay; 