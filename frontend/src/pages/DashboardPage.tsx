import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Spin,
  Space,
  Progress,
  Empty,
  Tooltip,
  Badge,
} from 'antd';
import {
  ShoppingOutlined,
  DollarOutlined,
  UserOutlined,
  CreditCardOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalCards: number;
  completedOrders: number;
  pendingOrders: number;
}

interface TopCard {
  cardId: string;
  salesCount: number;
  totalQuantity: number;
  totalRevenue: number;
  card: {
    id: string;
    name: string;
    category: string;
    price: number;
  };
}

interface CategoryRevenue {
  orders: number;
  revenue: number;
  'card.category': string;
}

interface SupplierPerformance {
  id: string;
  name: string;
  rating: number;
  totalSales: number;
  orderCount: number;
  revenue: number;
}

interface CustomerInsights {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  repeatCustomers: number;
}

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topCards, setTopCards] = useState<TopCard[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierPerformance[]>([]);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsights | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 30 seconds for real-time data
    const interval = setInterval(() => {
      refreshDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadTopCards(),
        loadCategoryRevenue(),
        loadSuppliers(),
        loadCustomerInsights(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboardData = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        loadStats(),
        loadTopCards(),
        loadCategoryRevenue(),
        loadSuppliers(),
        loadCustomerInsights(),
      ]);
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadTopCards = async () => {
    try {
      const response = await api.getTopSellingCards(10, 30);
      if (response.success) {
        setTopCards(response.data);
      }
    } catch (error) {
      console.error('Failed to load top cards:', error);
    }
  };

  const loadCategoryRevenue = async () => {
    try {
      const response = await api.getRevenueByCategory(30);
      if (response.success) {
        setCategoryRevenue(response.data);
      }
    } catch (error) {
      console.error('Failed to load category revenue:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await api.getSupplierPerformance(5);
      if (response.success) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const loadCustomerInsights = async () => {
    try {
      const response = await api.getCustomerInsights();
      if (response.success) {
        setCustomerInsights(response.data);
      }
    } catch (error) {
      console.error('Failed to load customer insights:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      game: 'purple',
      entertainment: 'magenta',
      mobile: 'blue',
      gift: 'orange',
    };
    return colors[category] || 'default';
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      game: 'Gaming',
      entertainment: 'Entertainment',
      mobile: 'Mobile',
      gift: 'Gift Cards',
    };
    return names[category] || category;
  };

  const topCardsColumns = [
    {
      title: 'Rank',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Space>
          {index === 0 && <TrophyOutlined style={{ color: '#ffd700', fontSize: 18 }} />}
          {index === 1 && <TrophyOutlined style={{ color: '#c0c0c0', fontSize: 18 }} />}
          {index === 2 && <TrophyOutlined style={{ color: '#cd7f32', fontSize: 18 }} />}
          {index > 2 && <span>#{index + 1}</span>}
        </Space>
      ),
    },
    {
      title: 'Card Name',
      dataIndex: ['card', 'name'],
      key: 'name',
      render: (name: string, record: TopCard) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Tag color={getCategoryColor(record.card.category)}>
            {getCategoryName(record.card.category)}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Sales',
      dataIndex: 'salesCount',
      key: 'sales',
      sorter: (a: TopCard, b: TopCard) => a.salesCount - b.salesCount,
      render: (count: number) => <Text>{count}</Text>,
    },
    {
      title: 'Quantity',
      dataIndex: 'totalQuantity',
      key: 'quantity',
      sorter: (a: TopCard, b: TopCard) => a.totalQuantity - b.totalQuantity,
    },
    {
      title: 'Revenue',
      dataIndex: 'totalRevenue',
      key: 'revenue',
      sorter: (a: TopCard, b: TopCard) => a.totalRevenue - b.totalRevenue,
      render: (revenue: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${revenue?.toFixed(2) || '0.00'}
        </Text>
      ),
    },
  ];

  const supplierColumns = [
    {
      title: 'Supplier',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: SupplierPerformance) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Space size={4}>
            <StarOutlined style={{ color: '#faad14', fontSize: 12 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.rating?.toFixed(1) || 'N/A'}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Orders',
      dataIndex: 'orderCount',
      key: 'orders',
      render: (count: number) => <Text>{count || 0}</Text>,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${revenue?.toFixed(2) || '0.00'}
        </Text>
      ),
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (record: SupplierPerformance) => {
        const maxRevenue = Math.max(...suppliers.map((s) => s.revenue || 0));
        const percentage = maxRevenue > 0 ? ((record.revenue || 0) / maxRevenue) * 100 : 0;
        return (
          <Progress
            percent={Number(percentage.toFixed(0))}
            size="small"
            status="active"
            strokeColor="#52c41a"
          />
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  const completionRate = stats
    ? stats.totalOrders > 0
      ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1)
      : '0'
    : '0';

  return (
    <div className="container">
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Admin Dashboard</Title>
          <Badge status={refreshing ? 'processing' : 'success'} text={refreshing ? 'Refreshing...' : 'Live'} />
        </div>

        {/* Overview Stats */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Orders"
                value={stats?.totalOrders || 0}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Space style={{ marginTop: 8 }}>
                <Tag icon={<CheckCircleOutlined />} color="success">
                  {stats?.completedOrders || 0} Completed
                </Tag>
                <Tag icon={<ClockCircleOutlined />} color="warning">
                  {stats?.pendingOrders || 0} Pending
                </Tag>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={stats?.totalRevenue || 0}
                prefix="$"
                precision={2}
                valueStyle={{ color: '#52c41a' }}
                suffix={<DollarOutlined />}
              />
              <Progress
                percent={Number(completionRate)}
                size="small"
                status="active"
                format={() => `${completionRate}% completion rate`}
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Users"
                value={stats?.totalUsers || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              {customerInsights && (
                <Space style={{ marginTop: 8 }} size={4}>
                  <Tooltip title="New this month">
                    <Tag color="processing">+{customerInsights.newCustomersThisMonth}</Tag>
                  </Tooltip>
                  <Tooltip title="Repeat customers">
                    <Tag color="success">{customerInsights.repeatCustomers} repeat</Tag>
                  </Tooltip>
                </Space>
              )}
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Cards"
                value={stats?.totalCards || 0}
                prefix={<CreditCardOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
              {categoryRevenue.length > 0 && (
                <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                  {categoryRevenue.length} categories
                </Text>
              )}
            </Card>
          </Col>
        </Row>

        {/* Category Revenue */}
        {categoryRevenue.length > 0 && (
          <Card title="Revenue by Category" bordered={false}>
            <Row gutter={[16, 16]}>
              {categoryRevenue.map((category) => {
                const totalRevenue = categoryRevenue.reduce((sum, c) => sum + Number(c.revenue || 0), 0);
                const percentage = totalRevenue > 0 ? ((Number(category.revenue || 0) / totalRevenue) * 100).toFixed(1) : '0';

                return (
                  <Col xs={24} sm={12} lg={6} key={category['card.category']}>
                    <Card size="small">
                      <Space direction="vertical" style={{ width: '100%' }} size={8}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Tag color={getCategoryColor(category['card.category'])}>
                            {getCategoryName(category['card.category'])}
                          </Tag>
                          <Text strong style={{ fontSize: 12 }}>{percentage}%</Text>
                        </div>
                        <Statistic
                          value={category.revenue || 0}
                          prefix="$"
                          precision={2}
                          valueStyle={{ fontSize: 20, color: '#52c41a' }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {category.orders || 0} orders
                        </Text>
                        <Progress
                          percent={Number(percentage)}
                          size="small"
                          showInfo={false}
                          strokeColor={getCategoryColor(category['card.category'])}
                        />
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>
        )}

        {/* Top Selling Cards */}
        <Card title="Top Selling Cards (Last 30 Days)" bordered={false}>
          {topCards.length > 0 ? (
            <Table
              columns={topCardsColumns}
              dataSource={topCards}
              rowKey="cardId"
              pagination={false}
              size="small"
            />
          ) : (
            <Empty description="No sales data available" />
          )}
        </Card>

        {/* Supplier Performance */}
        <Card title="Top Supplier Performance" bordered={false}>
          {suppliers.length > 0 ? (
            <Table
              columns={supplierColumns}
              dataSource={suppliers}
              rowKey="id"
              pagination={false}
              size="small"
            />
          ) : (
            <Empty description="No supplier data available" />
          )}
        </Card>

        {/* Customer Insights */}
        {customerInsights && (
          <Card title="Customer Insights" bordered={false}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Customers"
                  value={customerInsights.totalCustomers}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Active Customers"
                  value={customerInsights.activeCustomers}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="New This Month"
                  value={customerInsights.newCustomersThisMonth}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Repeat Customers"
                  value={customerInsights.repeatCustomers}
                  prefix={<StarOutlined />}
                  valueStyle={{ color: '#faad14' }}
                  suffix={
                    customerInsights.totalCustomers > 0 ? (
                      <Text type="secondary" style={{ fontSize: 14 }}>
                        ({((customerInsights.repeatCustomers / customerInsights.totalCustomers) * 100).toFixed(0)}%)
                      </Text>
                    ) : null
                  }
                />
              </Col>
            </Row>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default DashboardPage;
