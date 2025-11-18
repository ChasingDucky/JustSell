import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Button,
  Table,
  Tag,
  Progress,
  Alert,
  Spin,
  message,
  Empty,
  Divider,
} from 'antd';
import {
  DollarOutlined,
  CalendarOutlined,
  BellOutlined,
  SaveOutlined,
  CrownOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface SubscriptionData {
  totalSubscriptions: number;
  monthlyTotal: number;
  yearlyTotal: number;
  byCategory: Record<string, { count: number; monthly: number; yearly: number }>;
  expiringSoon: number;
  totalSavingsOpportunity: number;
  hasSubONE: boolean;
  suboneMembership?: any;
}

const SubscriptionDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<SubscriptionData | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [savings, setSavings] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, subscriptionsRes, savingsRes] = await Promise.all([
        api.getSubscriptionAnalytics(),
        api.getMySubscriptions({ status: 'active' }),
        api.getSavingsSuggestions(),
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (subscriptionsRes.success) setSubscriptions(subscriptionsRes.data);
      if (savingsRes.success) setSavings(savingsRes.data);
    } catch (error) {
      message.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      streaming: 'purple',
      music: 'cyan',
      gaming: 'blue',
      software: 'green',
      vpn: 'orange',
      cloud: 'geekblue',
      other: 'default',
    };
    return colors[category] || 'default';
  };

  const columns = [
    {
      title: 'Subscription',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.provider}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>{category.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Billing Cycle',
      dataIndex: 'cycle',
      key: 'cycle',
      render: (cycle: string) => cycle.charAt(0).toUpperCase() + cycle.slice(1),
    },
    {
      title: 'Monthly Cost',
      dataIndex: 'monthlyEquivalent',
      key: 'monthlyEquivalent',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Annual Cost',
      dataIndex: 'yearlyTotal',
      key: 'yearlyTotal',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Next Billing',
      dataIndex: 'nextBillingDate',
      key: 'nextBillingDate',
      render: (date: string) => (date ? new Date(date).toLocaleDateString() : 'N/A'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          active: 'green',
          pending_renewal: 'orange',
          expired: 'red',
          cancelled: 'default',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  const getPriorityColor = (priority: string) => {
    return priority === 'high' ? '#f5222d' : priority === 'medium' ? '#fa8c16' : '#52c41a';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!analytics) {
    return <Empty description="No subscription data available" />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2}>My Subscriptions</Title>
            <Paragraph>Track and manage all your subscription spending</Paragraph>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData}>
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/subscriptions/add')}
              >
                Add Subscription
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Key Metrics */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active Subscriptions"
                value={analytics.totalSubscriptions}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Monthly Cost"
                value={analytics.monthlyTotal}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Annual Cost"
                value={analytics.yearlyTotal}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
                suffix="/year"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Potential Savings"
                value={analytics.totalSavingsOpportunity}
                precision={2}
                prefix={<SaveOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
              {analytics.expiringSoon > 0 && (
                <Alert
                  message={`${analytics.expiringSoon} expiring soon`}
                  type="warning"
                  icon={<BellOutlined />}
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Savings Opportunities */}
        {savings.length > 0 && (
          <Card title={<Space><SaveOutlined /> Smart Savings Recommendations</Space>}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {savings.map((suggestion, index) => (
                <Card
                  key={index}
                  size="small"
                  style={{
                    borderLeft: `4px solid ${getPriorityColor(suggestion.priority)}`,
                  }}
                >
                  <Row align="middle" justify="space-between">
                    <Col span={16}>
                      <Space direction="vertical" size={4}>
                        <Text strong style={{ fontSize: 16 }}>
                          {suggestion.title}
                        </Text>
                        <Text type="secondary">{suggestion.description}</Text>
                        <Space>
                          <Tag color="red">Current: {formatCurrency(suggestion.currentCost)}</Tag>
                          <Tag color="green">New: {formatCurrency(suggestion.newCost)}</Tag>
                        </Space>
                      </Space>
                    </Col>
                    <Col span={8} style={{ textAlign: 'right' }}>
                      <Space direction="vertical" align="end" size={4}>
                        <Text
                          strong
                          style={{ fontSize: 24, color: '#3f8600' }}
                        >
                          Save {formatCurrency(suggestion.savings)}
                        </Text>
                        <Tag color="green">{suggestion.savingsPercent}% off</Tag>
                        <Button
                          type="primary"
                          onClick={() => {
                            if (suggestion.type === 'subone') {
                              navigate('/subone');
                            } else {
                              message.info('Feature coming soon!');
                            }
                          }}
                        >
                          {suggestion.action}
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>
        )}

        {/* SubONE Promotion */}
        {!analytics.hasSubONE && analytics.totalSubscriptions >= 2 && (
          <Alert
            message="💡 Supercharge Your Savings with SubONE!"
            description={
              <Space direction="vertical">
                <Text>
                  Bundle your streaming services with SubONE Family Plan and save up to $840/year!
                  Share with up to 8 family members.
                </Text>
                <Button
                  type="primary"
                  icon={<CrownOutlined />}
                  onClick={() => navigate('/subone')}
                >
                  Explore SubONE Plans
                </Button>
              </Space>
            }
            type="success"
            showIcon
            icon={<CrownOutlined />}
          />
        )}

        {/* Category Breakdown */}
        <Card title="Spending by Category">
          <Row gutter={[16, 16]}>
            {Object.entries(analytics.byCategory).map(([category, data]) => {
              const percentage = (data.monthly / analytics.monthlyTotal) * 100;
              return (
                <Col key={category} xs={24} md={12} lg={8}>
                  <Card size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Row justify="space-between">
                        <Col>
                          <Tag color={getCategoryColor(category)}>
                            {category.toUpperCase()}
                          </Tag>
                        </Col>
                        <Col>
                          <Text strong>{data.count} services</Text>
                        </Col>
                      </Row>
                      <Progress
                        percent={Math.round(percentage)}
                        strokeColor={getCategoryColor(category)}
                      />
                      <Row justify="space-between">
                        <Col>
                          <Text type="secondary">Monthly</Text>
                        </Col>
                        <Col>
                          <Text strong>{formatCurrency(data.monthly)}</Text>
                        </Col>
                      </Row>
                      <Row justify="space-between">
                        <Col>
                          <Text type="secondary">Yearly</Text>
                        </Col>
                        <Col>
                          <Text strong>{formatCurrency(data.yearly)}</Text>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>

        {/* Subscriptions Table */}
        <Card title="All Subscriptions">
          <Table
            columns={columns}
            dataSource={subscriptions}
            rowKey="id"
            pagination={false}
          />
        </Card>
      </Space>
    </div>
  );
};

export default SubscriptionDashboard;
