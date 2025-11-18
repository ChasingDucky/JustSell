import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Typography,
  Input,
  Button,
  Space,
  Avatar,
  Tag,
  Select,
  message,
  Spin,
  Empty,
  Tooltip,
  Divider,
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  DeleteOutlined,
  SwapOutlined,
  ShoppingOutlined,
  DollarOutlined,
  LineChartOutlined,
  StarOutlined,
  QuestionCircleOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import api from '../services/api';
import './AIAssistantPage.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentType?: string;
}

interface Agent {
  type: string;
  name: string;
  description: string;
}

interface ChatResponse {
  response: {
    message: string;
    data?: any;
    suggestions?: string[];
    actions?: any[];
  };
  agentType: string;
  conversationId: string;
}

const AIAssistantPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [conversationId, setConversationId] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingApiKey, setCheckingApiKey] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    loadAgents();
    checkApiKeyStatus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAgents = async () => {
    try {
      const response = await api.getAvailableAgents();
      setAgents(response.data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const checkApiKeyStatus = async () => {
    try {
      setCheckingApiKey(true);
      const response = await api.getAISettings();
      setHasApiKey(response.data.hasApiKey);
    } catch (error) {
      console.error('Failed to check API key status:', error);
    } finally {
      setCheckingApiKey(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (!hasApiKey) {
      message.warning('Please configure your Gemini API key in Profile > AI Assistant settings first');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response: { data: ChatResponse } = await api.chatWithAI({
        message: inputMessage,
        conversationId: conversationId || undefined,
        agentType: selectedAgent,
      });

      const { data } = response;

      // Update conversation ID if new
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response.message,
        timestamp: new Date(),
        agentType: data.agentType,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-focus input after response
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to send message');
      // Remove the user message if request failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleClearConversation = async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      await api.clearConversation(conversationId);
      setMessages([]);
      setConversationId('');
      message.success('Conversation cleared');
    } catch (error) {
      message.error('Failed to clear conversation');
    }
  };

  const handleSwitchAgent = async (agentType: string) => {
    setSelectedAgent(agentType);

    if (conversationId) {
      try {
        await api.switchAgent(conversationId, agentType);
        message.success('Agent switched successfully');
      } catch (error) {
        message.error('Failed to switch agent');
      }
    }
  };

  const getAgentIcon = (agentType?: string) => {
    switch (agentType) {
      case 'product_recommendation':
        return <ShoppingOutlined />;
      case 'budget_planner':
        return <DollarOutlined />;
      case 'price_comparison':
        return <LineChartOutlined />;
      case 'review_analysis':
        return <StarOutlined />;
      case 'shopping_consultant':
        return <QuestionCircleOutlined />;
      default:
        return <RobotOutlined />;
    }
  };

  const getAgentColor = (agentType?: string) => {
    switch (agentType) {
      case 'product_recommendation':
        return '#52c41a';
      case 'budget_planner':
        return '#faad14';
      case 'price_comparison':
        return '#1890ff';
      case 'review_analysis':
        return '#eb2f96';
      case 'shopping_consultant':
        return '#722ed1';
      default:
        return '#8c8c8c';
    }
  };

  const getAgentName = (agentType?: string) => {
    const agent = agents.find(a => a.type === agentType);
    return agent?.name || 'AI Assistant';
  };

  if (checkingApiKey) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="container">
        <Card>
          <Empty
            image={<RobotOutlined style={{ fontSize: '64px', color: '#1890ff' }} />}
            description={
              <div>
                <Title level={3}>AI Assistant Not Configured</Title>
                <Paragraph>
                  You need to configure your Gemini API key to use AI shopping assistants.
                </Paragraph>
                <Button type="primary" href="/profile?tab=ai">
                  Configure AI Settings
                </Button>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="container ai-assistant-page">
      <Card>
        <div className="ai-assistant-header">
          <div>
            <Title level={2}>
              <RobotOutlined /> AI Shopping Assistant
            </Title>
            <Text type="secondary">
              Get personalized shopping advice powered by Google Gemini
            </Text>
          </div>

          <Space>
            <Select
              style={{ width: 250 }}
              placeholder="Select AI Agent"
              value={selectedAgent}
              onChange={handleSwitchAgent}
              allowClear
            >
              {agents.map((agent) => (
                <Option key={agent.type} value={agent.type}>
                  <Space>
                    {getAgentIcon(agent.type)}
                    {agent.name}
                  </Space>
                </Option>
              ))}
            </Select>

            {messages.length > 0 && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleClearConversation}
              >
                Clear Chat
              </Button>
            )}
          </Space>
        </div>

        <Divider />

        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <Empty
              image={<RobotOutlined style={{ fontSize: '48px', color: '#1890ff' }} />}
              description={
                <div>
                  <Text>Start a conversation with our AI shopping assistant</Text>
                  <div style={{ marginTop: '16px' }}>
                    <Space wrap>
                      <Tag>Find products</Tag>
                      <Tag>Compare prices</Tag>
                      <Tag>Budget planning</Tag>
                      <Tag>Review analysis</Tag>
                      <Tag>Shopping advice</Tag>
                    </Space>
                  </div>
                </div>
              }
            />
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <Avatar
                  icon={msg.role === 'user' ? <UserOutlined /> : getAgentIcon(msg.agentType)}
                  style={{
                    backgroundColor: msg.role === 'user' ? '#1890ff' : getAgentColor(msg.agentType),
                  }}
                />
                <div className="message-content">
                  <div className="message-header">
                    <Text strong>
                      {msg.role === 'user' ? user?.firstName || 'You' : getAgentName(msg.agentType)}
                    </Text>
                    {msg.agentType && (
                      <Tag color={getAgentColor(msg.agentType)} style={{ marginLeft: '8px' }}>
                        {msg.agentType.replace(/_/g, ' ')}
                      </Tag>
                    )}
                    <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Text>
                  </div>
                  <div className="message-text">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="message assistant-message">
              <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#8c8c8c' }} />
              <div className="message-content">
                <Spin size="small" /> <Text type="secondary">AI is thinking...</Text>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input">
          <TextArea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask me anything about products, prices, budgets, or shopping advice..."
            autoSize={{ minRows: 2, maxRows: 6 }}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            loading={loading}
            disabled={!inputMessage.trim() || loading}
            size="large"
          >
            Send
          </Button>
        </div>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="quick-actions">
            <Text type="secondary">Try asking:</Text>
            <Space wrap style={{ marginTop: '8px' }}>
              <Button
                size="small"
                onClick={() => setInputMessage('Recommend me a good gaming gift card')}
              >
                Recommend gaming cards
              </Button>
              <Button
                size="small"
                onClick={() => setInputMessage('Compare prices for Netflix subscriptions')}
              >
                Compare Netflix prices
              </Button>
              <Button
                size="small"
                onClick={() => setInputMessage('Help me plan my monthly subscription budget')}
              >
                Budget planning
              </Button>
              <Button
                size="small"
                onClick={() => setInputMessage('What do people say about Amazon gift cards?')}
              >
                Review analysis
              </Button>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AIAssistantPage;
