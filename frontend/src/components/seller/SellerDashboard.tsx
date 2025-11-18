import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Tag,
  Button,
  Tabs,
  Table,
  Badge,
  Progress,
  Spin,
  message,
} from 'antd';
import {
  ShopOutlined,
  DollarOutlined,
  ShoppingOutlined,
  StarOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface DashboardData {
  seller: any;
  stats: any;
}

const SellerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.getSellerDashboard();
      if (response.success) {
        setData(response.data);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        navigate('/seller/apply');
      } else {
        message.error('Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { seller, stats } = data;

  const getLevelColor = (level: string) => {
    const colors: any = {
      newcomer: 'default',
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700',
      platinum: '#e5e4e2',
      diamond: '#b9f2ff',
    };
    return colors[level] || 'default';
  };

  const getStatusTag = (status: string) => {
    const statusConfig: any = {
      pending: { color: 'orange', text: 'Pending Approval' },
      active: { color: 'green', text: 'Active' },
      suspended: { color: 'red', text: 'Suspended' },
      banned: { color: 'red', text: 'Banned' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Card>
          <Row align="middle" justify="space-between">
            <Col>
              <Space>
                <ShopOutlined style={{ fontSize: 40, color: '#1890ff' }} />
                <div>
                  <Title level={3} style={{ margin: 0 }}>
                    {seller.storeName}
                  </Title>
                  <Space>
                    {getStatusTag(seller.status)}
                    <Tag color={getLevelColor(seller.level)} icon={<TrophyOutlined />}>
                      {seller.level.toUpperCase()}
                    </Tag>
                    {seller.verified && <Tag color="blue">Verified</Tag>}
                  </Space>
                </div>
              </Space>
            </Col>
            <Col>
              <Button type="primary" onClick={() => navigate('/seller/listings/create')}>
                Create New Listing
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Statistics */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Sales"
                value={stats.totalSales}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={stats.totalRevenue}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active Listings"
                value={stats.activeListings}
                suffix={`/ ${stats.totalListings}`}
                prefix={<ShopOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Rating"
                value={stats.rating}
                precision={2}
                prefix={<StarOutlined />}
                suffix={`(${stats.totalReviews})`}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Performance Metrics */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Seller Performance">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>Completion Rate</Text>
                  <Progress
                    percent={stats.completionRate}
                    status={stats.completionRate >= 95 ? 'success' : 'normal'}
                  />
                </div>
                <div>
                  <Text>Reputation Score</Text>
                  <Progress
                    percent={stats.reputationScore}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
                <div>
                  <Row justify="space-between">
                    <Col>
                      <Statistic
                        title="Avg Response Time"
                        value={stats.responseTime}
                        suffix="min"
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                    <Col>
                      <Statistic
                        title="Pending Orders"
                        value={stats.pendingOrders}
                        valueStyle={{ color: stats.pendingOrders > 0 ? '#cf1322' : '#3f8600' }}
                      />
                    </Col>
                  </Row>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Level Progress">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Current Level: {seller.level.toUpperCase()}</Text>
                </div>
                <div>
                  <Text type="secondary">Level up requirements:</Text>
                  <ul>
                    <li>Complete more sales to unlock higher levels</li>
                    <li>Maintain high rating (4.5+)</li>
                    <li>Keep completion rate above 95%</li>
                  </ul>
                </div>
                <Button
                  type="link"
                  icon={<RiseOutlined />}
                  onClick={() => message.info('Level requirements feature coming soon!')}
                >
                  View All Level Requirements
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Button
                block
                onClick={() => navigate('/seller/listings')}
              >
                Manage Listings
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                block
                onClick={() => navigate('/seller/orders')}
              >
                View Orders
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                block
                onClick={() => navigate('/seller/escrows')}
              >
                Escrow Transactions
              </Button>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                block
                onClick={() => navigate('/seller/profile')}
              >
                Edit Profile
              </Button>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
};

export default SellerDashboard;
