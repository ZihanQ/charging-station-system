import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Progress, Button, message } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const ChargingQueue: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('数据已刷新');
    }, 1000);
  };

  // 模拟排队数据
  const queueData = [
    {
      key: '1',
      queueNumber: 'F1',
      username: '张三',
      chargingMode: '快充',
      requestedAmount: 30,
      batteryCapacity: 60,
      waitingTime: '5分钟',
      position: 1,
      status: 'IN_QUEUE'
    },
    {
      key: '2',
      queueNumber: 'F2',
      username: '李四',
      chargingMode: '快充',
      requestedAmount: 25,
      batteryCapacity: 50,
      waitingTime: '10分钟',
      position: 2,
      status: 'WAITING'
    },
    {
      key: '3',
      queueNumber: 'T1',
      username: '王五',
      chargingMode: '慢充',
      requestedAmount: 20,
      batteryCapacity: 40,
      waitingTime: '15分钟',
      position: 1,
      status: 'WAITING'
    }
  ];

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'WAITING':
        return <Tag color="orange">等候区等待</Tag>;
      case 'IN_QUEUE':
        return <Tag color="blue">充电桩队列</Tag>;
      case 'CHARGING':
        return <Tag color="green">充电中</Tag>;
      case 'COMPLETED':
        return <Tag color="gray">已完成</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const columns = [
    {
      title: '排队号码',
      dataIndex: 'queueNumber',
      key: 'queueNumber',
      render: (text: string) => (
        <span className="font-bold text-lg text-blue-600">{text}</span>
      )
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '充电模式',
      dataIndex: 'chargingMode',
      key: 'chargingMode',
      render: (mode: string) => (
        <Tag color={mode === '快充' ? 'red' : 'blue'}>{mode}</Tag>
      )
    },
    {
      title: '电池容量',
      dataIndex: 'batteryCapacity',
      key: 'batteryCapacity',
      render: (capacity: number) => `${capacity}度`
    },
    {
      title: '请求充电量',
      dataIndex: 'requestedAmount',
      key: 'requestedAmount',
      render: (amount: number) => `${amount}度`
    },
    {
      title: '充电进度',
      key: 'progress',
      render: (record: any) => {
        const progress = (record.requestedAmount / record.batteryCapacity) * 100;
        return (
          <Progress 
            percent={Math.round(progress)} 
            size="small" 
            status={record.status === 'CHARGING' ? 'active' : 'normal'}
          />
        );
      }
    },
    {
      title: '队列位置',
      dataIndex: 'position',
      key: 'position',
      render: (position: number) => (
        <span className="font-semibold">第 {position} 位</span>
      )
    },
    {
      title: '等待时间',
      dataIndex: 'waitingTime',
      key: 'waitingTime'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
              size="large"
            >
              返回
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">充电排队状态</h1>
          </div>
          
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={refreshData}
            loading={loading}
            size="large"
          >
            刷新数据
          </Button>
        </div>

        <Card className="shadow-lg">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">实时排队信息</h2>
            <p className="text-gray-600">
              当前共有 <span className="font-semibold text-blue-600">{queueData.length}</span> 辆车在排队
            </p>
          </div>
          
          <Table 
            columns={columns}
            dataSource={queueData}
            pagination={false}
            scroll={{ x: 1000 }}
            className="custom-table"
          />
        </Card>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">快充队列</h3>
            <p className="text-3xl font-bold text-red-500">
              {queueData.filter(item => item.chargingMode === '快充').length}
            </p>
            <p className="text-gray-600">辆车等待</p>
          </Card>
          
          <Card className="text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">慢充队列</h3>
            <p className="text-3xl font-bold text-blue-500">
              {queueData.filter(item => item.chargingMode === '慢充').length}
            </p>
            <p className="text-gray-600">辆车等待</p>
          </Card>
          
          <Card className="text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">平均等待时间</h3>
            <p className="text-3xl font-bold text-green-500">12</p>
            <p className="text-gray-600">分钟</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChargingQueue; 