import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Space,
  Alert,
  Divider,
  Tag,
  Switch,
  message,
  Spin,
  Modal,
} from 'antd';
import {
  ApiOutlined,
  RobotOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;

interface AISettings {
  id: string;
  geminiApiKey?: string;
  enableAI: boolean;
  preferredModel?: string;
  hasApiKey: boolean;
}

interface AvailableModels {
  isPremiumUser: boolean;
  availableModels: Array<{
    name: string;
    displayName: string;
    description: string;
    tier: string;
  }>;
  currentModel: string;
}

const AISettingsTab: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [availableModels, setAvailableModels] = useState<AvailableModels | null>(null);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const [form] = Form.useForm();
  const [apiKeyForm] = Form.useForm();

  useEffect(() => {
    loadSettings();
    loadAvailableModels();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.getAISettings();
      setSettings(response.data);
    } catch (error: any) {
      message.error('Failed to load AI settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableModels = async () => {
    try {
      const response = await api.getAvailableAIModels();
      setAvailableModels(response.data);
    } catch (error: any) {
      console.error('Failed to load available models:', error);
    }
  };

  const handleUpdateApiKey = async (values: { geminiApiKey: string }) => {
    try {
      setLoading(true);
      const response = await api.updateGeminiApiKey(values.geminiApiKey);

      if (response.success) {
        message.success('Gemini API key saved successfully!');
        setApiKeyModalVisible(false);
        apiKeyForm.resetFields();
        await loadSettings();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save API key. Please check your key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    try {
      setLoading(true);
      const response = await api.removeGeminiApiKey();

      if (response.success) {
        message.success('API key removed successfully');
        setDeleteConfirmVisible(false);
        await loadSettings();
      }
    } catch (error: any) {
      message.error('Failed to remove API key');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAI = async (checked: boolean) => {
    try {
      setLoading(true);
      const response = await api.updateAIPreferences({ enableAI: checked });

      if (response.success) {
        message.success(`AI assistant ${checked ? 'enabled' : 'disabled'}`);
        await loadSettings();
      }
    } catch (error: any) {
      message.error('Failed to update AI preferences');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const getMembershipTier = () => {
    if (availableModels?.isPremiumUser) {
      return (
        <Tag icon={<CrownOutlined />} color="gold" style={{ fontSize: '14px', padding: '4px 12px' }}>
          Premium Member
        </Tag>
      );
    }
    return (
      <Tag color="default" style={{ fontSize: '14px', padding: '4px 12px' }}>
        Regular User
      </Tag>
    );
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Title level={3} style={{ margin: 0 }}>
              <RobotOutlined /> AI Assistant Settings
            </Title>
            {getMembershipTier()}
          </div>
          <Text type="secondary">
            Configure your AI shopping assistant powered by Google Gemini
          </Text>
        </div>

        {/* Membership & Model Info */}
        <Alert
          type={availableModels?.isPremiumUser ? 'success' : 'info'}
          showIcon
          icon={availableModels?.isPremiumUser ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
          message={
            <div>
              <strong>Current AI Model:</strong>{' '}
              {availableModels?.currentModel === 'gemini-1.5-pro' ? (
                <Tag color="purple">Gemini 1.5 Pro</Tag>
              ) : (
                <Tag color="blue">Gemini 2.0 Flash</Tag>
              )}
            </div>
          }
          description={
            availableModels?.isPremiumUser ? (
              <div>
                As a <strong>Premium Member</strong>, you have access to Gemini 1.5 Pro - our most powerful AI model
                with advanced reasoning and comprehensive analysis capabilities.
              </div>
            ) : (
              <div>
                You are using Gemini 2.0 Flash - fast and efficient for everyday shopping assistance.
                <br />
                <strong>Upgrade to SubONE Premium</strong> to unlock Gemini 1.5 Pro with advanced features!
              </div>
            )
          }
        />

        <Divider />

        {/* API Key Section */}
        <div>
          <Title level={4}>
            <ApiOutlined /> Gemini API Key
          </Title>
          <Paragraph type="secondary">
            To use AI shopping assistants, you need to provide your own Google Gemini API key.
            This allows you to use the AI features while maintaining control over your API usage.
          </Paragraph>

          {settings?.hasApiKey ? (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="API Key Configured"
              description={
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    Your Gemini API key is securely stored and ready to use.
                  </div>
                  <Space>
                    <Button
                      icon={<ApiOutlined />}
                      onClick={() => setApiKeyModalVisible(true)}
                    >
                      Update API Key
                    </Button>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setDeleteConfirmVisible(true)}
                    >
                      Remove API Key
                    </Button>
                  </Space>
                </div>
              }
            />
          ) : (
            <Alert
              type="warning"
              showIcon
              message="No API Key Configured"
              description={
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    You need to add your Gemini API key to use AI shopping assistants.
                    <br />
                    Get your free API key from{' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google AI Studio
                    </a>
                    .
                  </div>
                  <Button
                    type="primary"
                    icon={<ApiOutlined />}
                    onClick={() => setApiKeyModalVisible(true)}
                  >
                    Add API Key
                  </Button>
                </div>
              }
            />
          )}
        </div>

        <Divider />

        {/* AI Preferences */}
        <div>
          <Title level={4}>Preferences</Title>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Enable AI Assistant</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Turn on/off AI-powered shopping recommendations and assistance
              </Text>
            </div>
            <Switch
              checked={settings?.enableAI}
              onChange={handleToggleAI}
              disabled={!settings?.hasApiKey}
              loading={loading}
            />
          </div>
        </div>

        {/* How to Get API Key */}
        <Divider />
        <div>
          <Title level={4}>How to Get Your Gemini API Key</Title>
          <ol style={{ paddingLeft: '20px' }}>
            <li>
              Visit{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                Google AI Studio
              </a>
            </li>
            <li>Sign in with your Google account</li>
            <li>Click "Create API Key" button</li>
            <li>Copy the generated API key</li>
            <li>Paste it in the form above</li>
          </ol>
          <Alert
            type="info"
            showIcon
            message="API Key Security"
            description="Your API key is encrypted and stored securely. We never share your key with third parties."
          />
        </div>
      </Space>

      {/* API Key Modal */}
      <Modal
        title={
          <span>
            <ApiOutlined /> {settings?.hasApiKey ? 'Update' : 'Add'} Gemini API Key
          </span>
        }
        open={apiKeyModalVisible}
        onCancel={() => {
          setApiKeyModalVisible(false);
          apiKeyForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={apiKeyForm} layout="vertical" onFinish={handleUpdateApiKey}>
          <Form.Item
            label="Gemini API Key"
            name="geminiApiKey"
            rules={[
              { required: true, message: 'Please enter your Gemini API key' },
              { min: 20, message: 'API key seems too short' },
            ]}
          >
            <Input.Password
              prefix={<ApiOutlined />}
              placeholder="AIza..."
              autoComplete="off"
            />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message="Your API key will be validated before saving"
            style={{ marginBottom: '16px' }}
          />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setApiKeyModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                Save API Key
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Remove API Key"
        open={deleteConfirmVisible}
        onOk={handleDeleteApiKey}
        onCancel={() => setDeleteConfirmVisible(false)}
        okText="Remove"
        okButtonProps={{ danger: true, loading }}
        cancelText="Cancel"
      >
        <p>Are you sure you want to remove your Gemini API key?</p>
        <p>You won't be able to use AI shopping assistants until you add a new key.</p>
      </Modal>
    </Card>
  );
};

export default AISettingsTab;
