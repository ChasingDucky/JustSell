import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Tag,
  Statistic,
  Alert,
  List,
  Spin,
  message,
  Badge,
  Divider,
} from 'antd';
import {
  CrownOutlined,
  CheckOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface TierData {
  tier: string;
  price: number;
  familySlots: number;
  services: string[];
  servicesCount: number;
  estimatedMonthlySavings: number;
  estimatedYearlySavings: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const SubONEPlans: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [currentSubscriptionCost, setCurrentSubscriptionCost] = useState(0);
  const [userSavings, setUserSavings] = useState<any>(null);
  const [hasMembership, setHasMembership] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load tiers
      const tiersRes = await api.getSubONETiers();
      if (tiersRes.success) {
        setTiers(tiersRes.data);
      }

      // Load user's subscription analytics
      try {
        const analyticsRes = await api.getSubscriptionAnalytics();
        if (analyticsRes.success) {
          setCurrentSubscriptionCost(analyticsRes.data.monthlyTotal);
          setHasMembership(analyticsRes.data.hasSubONE);

          // Calculate savings if not already a member
          if (!analyticsRes.data.hasSubONE && analyticsRes.data.monthlyTotal > 0) {
            const savingsRes = await api.calculateSubONESavings(analyticsRes.data.monthlyTotal);
            if (savingsRes.success) {
              setUserSavings(savingsRes.data);
            }
          }
        }
      } catch (error) {
        // User might not be logged in or have no subscriptions
      }
    } catch (error) {
      message.error('Failed to load SubONE plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier: string) => {
    try {
      const response = await api.subscribeToSubONE(tier, 12);
      if (response.success) {
        message.success('Successfully subscribed to SubONE!');
        navigate('/subscriptions/subone/membership');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        message.info('Please login to subscribe');
        navigate('/login');
      } else {
        message.error(error.response?.data?.message || 'Failed to subscribe');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      basic: '#1890ff',
      premium: '#722ed1',
      ultimate: '#faad14',
    };
    return colors[tier] || '#1890ff';
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Badge.Ribbon text="Save Up To $840/Year" color="green">
            <Card>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <CrownOutlined style={{ fontSize: 64, color: '#faad14' }} />
                </div>
                <Title level={1}>SubONE Family Plans</Title>
                <Paragraph style={{ fontSize: 18, maxWidth: 800, margin: '0 auto' }}>
                  Bundle all your favorite streaming services and share with your family.
                  One subscription, unlimited entertainment, massive savings.
                </Paragraph>
                {!hasMembership && userSavings && (
                  <Alert
                    message={
                      <Text strong style={{ fontSize: 16 }}>
                        🎉 You could save{' '}
                        <Text style={{ fontSize: 20, color: '#3f8600' }}>
                          ${userSavings.yearlySavings.toFixed(2)}/year
                        </Text>{' '}
                        with SubONE!
                      </Text>
                    }
                    description={
                      <Text>
                        Based on your current subscriptions ({userSavings.servicesIncluded.length} services),
                        we recommend the {userSavings.recommendedTier.toUpperCase()} plan
                      </Text>
                    }
                    type="success"
                    showIcon
                    icon={<GiftOutlined />}
                  />
                )}
              </Space>
            </Card>
          </Badge.Ribbon>
        </div>

        {/* Pricing Cards */}
        <Row gutter={[24, 24]}>
          {tiers.map((tier) => {
            const isRecommended = userSavings && tier.tier === userSavings.recommendedTier;
            const perPersonCost = tier.price / tier.familySlots;

            return (
              <Col key={tier.tier} xs={24} md={8}>
                <Badge.Ribbon
                  text={tier.popular ? 'Most Popular' : isRecommended ? 'Recommended' : ''}
                  color={tier.popular ? '#722ed1' : '#52c41a'}
                  style={{ display: tier.popular || isRecommended ? 'block' : 'none' }}
                >
                  <Card
                    hoverable
                    style={{
                      height: '100%',
                      borderColor: getTierColor(tier.tier),
                      borderWidth: tier.popular ? 3 : 1,
                    }}
                  >
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      {/* Header */}
                      <div style={{ textAlign: 'center' }}>
                        <Tag color={getTierColor(tier.tier)} style={{ fontSize: 14 }}>
                          {tier.tier.toUpperCase()}
                        </Tag>
                        <Title level={2} style={{ margin: '16px 0 8px' }}>
                          ${tier.price}/mo
                        </Title>
                        <Text type="secondary">{tier.description}</Text>
                      </div>

                      <Divider />

                      {/* Key Stats */}
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Statistic
                            title="Family Slots"
                            value={tier.familySlots}
                            prefix={<TeamOutlined />}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Services"
                            value={tier.servicesCount}
                            prefix={<CrownOutlined />}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Per Person"
                            value={perPersonCost}
                            precision={2}
                            prefix={<DollarOutlined />}
                            suffix="/mo"
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Yearly Savings"
                            value={tier.estimatedYearlySavings}
                            precision={0}
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                          />
                        </Col>
                      </Row>

                      <Divider />

                      {/* Included Services */}
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          Included Services:
                        </Text>
                        <List
                          size="small"
                          dataSource={tier.services}
                          renderItem={(service) => (
                            <List.Item style={{ border: 'none', padding: '4px 0' }}>
                              <CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                              {service}
                            </List.Item>
                          )}
                        />
                      </div>

                      <Divider />

                      {/* Features */}
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          Features:
                        </Text>
                        <List
                          size="small"
                          dataSource={tier.features}
                          renderItem={(feature) => (
                            <List.Item style={{ border: 'none', padding: '4px 0' }}>
                              <CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                              {feature}
                            </List.Item>
                          )}
                        />
                      </div>

                      {/* CTA Button */}
                      <Button
                        type={tier.popular ? 'primary' : 'default'}
                        size="large"
                        block
                        onClick={() => handleSubscribe(tier.tier)}
                        disabled={hasMembership}
                      >
                        {hasMembership ? 'Already Subscribed' : `Choose ${tier.tier.toUpperCase()}`}
                      </Button>
                    </Space>
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>

        {/* How It Works */}
        <Card title={<Title level={3}>How SubONE Works</Title>}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card size="small" style={{ textAlign: 'center', height: '100%' }}>
                <Space direction="vertical">
                  <div style={{ fontSize: 48 }}>1️⃣</div>
                  <Title level={4}>Choose Your Plan</Title>
                  <Text>Select a tier that fits your family size and viewing preferences</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ textAlign: 'center', height: '100%' }}>
                <Space direction="vertical">
                  <div style={{ fontSize: 48 }}>2️⃣</div>
                  <Title level={4}>Invite Family</Title>
                  <Text>Add up to {tiers[tiers.length - 1]?.familySlots || 8} family members to share the cost</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ textAlign: 'center', height: '100%' }}>
                <Space direction="vertical">
                  <div style={{ fontSize: 48 }}>3️⃣</div>
                  <Title level={4}>Start Saving</Title>
                  <Text>Enjoy all services while saving hundreds of dollars per year!</Text>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* FAQ */}
        <Card title={<Title level={3}>Frequently Asked Questions</Title>}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Can I upgrade or downgrade my plan?</Text>
              <Paragraph>
                Yes! You can upgrade to a higher tier anytime. Contact support for downgrades.
              </Paragraph>
            </div>
            <Divider />
            <div>
              <Text strong>What happens if someone leaves my family plan?</Text>
              <Paragraph>
                You can easily remove members and add new ones from your dashboard.
              </Paragraph>
            </div>
            <Divider />
            <div>
              <Text strong>Can I cancel anytime?</Text>
              <Paragraph>
                Absolutely! No contracts or commitments. Cancel anytime from your account settings.
              </Paragraph>
            </div>
            <Divider />
            <div>
              <Text strong>How does billing work with family sharing?</Text>
              <Paragraph>
                The plan owner pays the monthly fee. You can split costs with family members however you like.
              </Paragraph>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default SubONEPlans;
