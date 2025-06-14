import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, Select, DatePicker, 
  message, Space, Tag, Switch, Popconfirm, Typography, Statistic 
} from 'antd';
import { 
  PlayCircleOutlined, PauseCircleOutlined, PlusOutlined, 
  DeleteOutlined, EditOutlined, ExperimentOutlined,
  ReloadOutlined, UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient, { apiUtils } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface TestTask {
  id: string;
  triggerTime: string;
  action: 'CREATE_CHARGING_REQUEST' | 'MODIFY_REQUEST' | 'CANCEL_REQUEST';
  userId: string;
  chargingMode: 'FAST' | 'SLOW';
  requestedAmount: number;
  isExecuted: boolean;
  executedAt?: string;
}

interface TestScript {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  tasks: TestTask[];
}

interface TestScriptStatus {
  isRunning: boolean;
  scriptsCount: number;
  activeScriptsCount: number;
  totalTasks: number;
  executedTasks: number;
}

const TestScriptManager: React.FC = () => {
  const [scripts, setScripts] = useState<TestScript[]>([]);
  const [status, setStatus] = useState<TestScriptStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScript, setEditingScript] = useState<TestScript | null>(null);
  const [form] = Form.useForm();

  // 获取测试脚本列表
  const fetchScripts = async () => {
    try {
      const response = await apiClient.get('/test-script/scripts');
      if (response.data.success) {
        setScripts(response.data.data);
      }
    } catch (error) {
      console.error('获取测试脚本失败:', error);
    }
  };

  // 获取测试脚本服务状态
  const fetchStatus = async () => {
    try {
      const response = await apiClient.get('/test-script/status');
      if (response.data.success) {
        setStatus(response.data.data);
      }
    } catch (error) {
      console.error('获取测试脚本状态失败:', error);
    }
  };

  // 创建/更新测试脚本
  const handleSaveScript = async (values: any) => {
    setLoading(true);
    try {
      const scriptData = {
        name: values.name,
        description: values.description,
        tasks: values.tasks.map((task: any) => ({
          triggerTime: task.triggerTime.toDate(),
          action: task.action,
          userId: task.userId,
          chargingMode: task.chargingMode,
          requestedAmount: task.requestedAmount
        }))
      };

      const response = await apiClient.post('/test-script/scripts', scriptData);
      
      if (response.data.success) {
        message.success('测试脚本保存成功');
        setModalVisible(false);
        form.resetFields();
        fetchScripts();
      } else {
        message.error(response.data.message || '保存失败');
      }
    } catch (error: any) {
      message.error(apiUtils.handleError(error));
    }
    setLoading(false);
  };

  // 启用/禁用测试脚本
  const toggleScript = async (scriptId: string, isActive: boolean) => {
    setLoading(true);
    try {
      const response = await apiClient.patch(`/test-script/scripts/${scriptId}/toggle`, {
        isActive
      });
      
      if (response.data.success) {
        message.success(response.data.message);
        fetchScripts();
        fetchStatus();
      } else {
        message.error(response.data.message || '操作失败');
      }
    } catch (error: any) {
      message.error(apiUtils.handleError(error));
    }
    setLoading(false);
  };

  // 删除测试脚本
  const deleteScript = async (scriptId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.delete(`/test-script/scripts/${scriptId}`);
      
      if (response.data.success) {
        message.success('测试脚本删除成功');
        fetchScripts();
        fetchStatus();
      } else {
        message.error(response.data.message || '删除失败');
      }
    } catch (error: any) {
      message.error(apiUtils.handleError(error));
    }
    setLoading(false);
  };

  // 创建默认测试场景
  const createDefaultScenarios = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/test-script/default-scenarios');
      
      if (response.data.success) {
        message.success('默认测试场景创建成功');
        fetchScripts();
        fetchStatus();
      } else {
        message.error(response.data.message || '创建失败');
      }
    } catch (error: any) {
      message.error(apiUtils.handleError(error));
    }
    setLoading(false);
  };

  // 重置所有任务状态
  const resetAllTasks = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/test-script/reset-tasks');
      
      if (response.data.success) {
        message.success('所有测试任务状态已重置');
        fetchScripts();
        fetchStatus();
      } else {
        message.error(response.data.message || '重置失败');
      }
    } catch (error: any) {
      message.error(apiUtils.handleError(error));
    }
    setLoading(false);
  };

  // 打开创建模态框
  const openModal = () => {
    form.resetFields();
    setModalVisible(true);
  };

  useEffect(() => {
    fetchScripts();
    fetchStatus();
    
    // 每10秒更新一次状态
    const interval = setInterval(() => {
      fetchScripts();
      fetchStatus();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const columns = [
    {
      title: '脚本名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TestScript) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div className="text-gray-500 text-sm">{record.description}</div>
          )}
        </div>
      )
    },
    {
      title: '任务数量',
      dataIndex: 'tasks',
      key: 'taskCount',
      render: (tasks: TestTask[]) => (
        <Space>
          <Tag color="blue">{tasks.length}个任务</Tag>
          <Tag color="green">{tasks.filter(t => t.isExecuted).length}已执行</Tag>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: TestScript) => (
        <Switch
          checked={isActive}
          loading={loading}
          onChange={(checked) => toggleScript(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: TestScript) => (
        <Space>
          <Popconfirm
            title="确认删除这个测试脚本吗？"
            onConfirm={() => deleteScript(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button 
              size="small" 
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* 状态统计 */}
      {status && (
        <Card title="测试脚本服务状态">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Statistic
              title="服务状态"
              value={status.isRunning ? '运行中' : '已停止'}
              valueStyle={{ color: status.isRunning ? '#52c41a' : '#ff4d4f' }}
            />
            <Statistic
              title="脚本总数"
              value={status.scriptsCount}
            />
            <Statistic
              title="活跃脚本"
              value={status.activeScriptsCount}
              valueStyle={{ color: '#1890ff' }}
            />
            <Statistic
              title="总任务数"
              value={status.totalTasks}
            />
            <Statistic
              title="已执行"
              value={status.executedTasks}
              suffix={`/ ${status.totalTasks}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </div>
        </Card>
      )}

      {/* 测试脚本列表 */}
      <Card 
        title={<span><ExperimentOutlined className="mr-2" />测试脚本管理</span>}
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchScripts();
                fetchStatus();
              }}
            >
              刷新
            </Button>
            <Button 
              type="dashed"
              onClick={createDefaultScenarios}
              loading={loading}
            >
              创建默认场景
            </Button>
            <Button 
              onClick={resetAllTasks}
              loading={loading}
            >
              重置任务状态
            </Button>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={openModal}
            >
              新建脚本
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={scripts}
          rowKey="id"
          loading={loading}
        />
      </Card>

      {/* 创建脚本模态框 */}
      <Modal
        title="创建测试脚本"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveScript}
        >
          <Form.Item
            label="脚本名称"
            name="name"
            rules={[{ required: true, message: '请输入脚本名称' }]}
          >
            <Input placeholder="请输入脚本名称" />
          </Form.Item>

          <Form.Item
            label="脚本描述"
            name="description"
          >
            <TextArea rows={3} placeholder="请输入脚本描述" />
          </Form.Item>

          <Form.List name="tasks">
            {(fields, { add, remove }) => (
              <>
                <div className="flex justify-between items-center mb-4">
                  <Title level={5}>测试任务</Title>
                  <Button 
                    type="dashed" 
                    onClick={() => add()} 
                    icon={<PlusOutlined />}
                  >
                    添加任务
                  </Button>
                </div>
                
                {fields.map(({ key, name, ...restField }) => (
                  <Card 
                    key={key}
                    size="small"
                    className="mb-4"
                    extra={
                      <Button 
                        type="text" 
                        danger
                        size="small"
                        onClick={() => remove(name)}
                        icon={<DeleteOutlined />}
                      >
                        删除
                      </Button>
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item
                        {...restField}
                        label="触发时间"
                        name={[name, 'triggerTime']}
                        rules={[{ required: true, message: '请选择触发时间' }]}
                      >
                        <DatePicker 
                          showTime 
                          format="YYYY-MM-DD HH:mm:ss"
                          className="w-full"
                        />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        label="操作类型"
                        name={[name, 'action']}
                        rules={[{ required: true, message: '请选择操作类型' }]}
                      >
                        <Select placeholder="请选择操作类型">
                          <Option value="CREATE_CHARGING_REQUEST">创建充电请求</Option>
                          <Option value="MODIFY_REQUEST">修改请求</Option>
                          <Option value="CANCEL_REQUEST">取消请求</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        label="测试用户ID"
                        name={[name, 'userId']}
                        rules={[{ required: true, message: '请输入用户ID' }]}
                      >
                        <Input placeholder="如: test_user_1" />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        label="充电模式"
                        name={[name, 'chargingMode']}
                        rules={[{ required: true, message: '请选择充电模式' }]}
                      >
                        <Select placeholder="请选择充电模式">
                          <Option value="FAST">快充</Option>
                          <Option value="SLOW">慢充</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        label="请求充电量(度)"
                        name={[name, 'requestedAmount']}
                        rules={[{ required: true, message: '请输入充电量' }]}
                      >
                        <Input type="number" placeholder="请输入充电量" />
                      </Form.Item>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </Form.List>

          <Form.Item className="mb-0">
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存脚本
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TestScriptManager; 