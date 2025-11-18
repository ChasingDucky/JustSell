import React, { useState, useEffect } from 'react';
import {
  Card,
  Radio,
  Space,
  Typography,
  Tag,
  Spin,
  Empty,
  Alert,
  Row,
  Col,
  Divider,
  message,
} from 'antd';
import {
  RocketOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;

interface ShippingRate {
  provider: string;
  type: 'standard' | 'express' | 'overnight' | 'international' | 'international_express';
  cost: number;
  estimatedDays: number;
  description?: string;
}

interface ShippingMethodSelectorProps {
  origin: {
    country: string;
    postalCode: string;
  };
  destination: {
    country: string;
    postalCode: string;
  };
  packageDimensions: {
    weight: number;
    length?: number;
    width?: number;
    height?: number;
  };
  onSelectMethod: (rate: ShippingRate) => void;
  selectedProvider?: string;
}

const ShippingMethodSelector: React.FC<ShippingMethodSelectorProps> = ({
  origin,
  destination,
  packageDimensions,
  onSelectMethod,
  selectedProvider,
}) => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);

  useEffect(() => {
    loadShippingRates();
  }, [origin, destination, packageDimensions]);

  const loadShippingRates = async () => {
    try {
      setLoading(true);
      const response = await api.calculateShippingRates({
        origin,
        destination,
        packageDimensions,
      });

      if (response.success) {
        setRates(response.data);
        // Auto-select cheapest option
        if (response.data.length > 0 && !selectedProvider) {
          const cheapest = response.data[0];
          setSelectedRate(cheapest.provider);
          onSelectMethod(cheapest);
        } else if (selectedProvider) {
          setSelectedRate(selectedProvider);
        }
      }
    } catch (error) {
      message.error('Failed to load shipping rates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRate = (provider: string) => {
    const rate = rates.find((r) => r.provider === provider);
    if (rate) {
      setSelectedRate(provider);
      onSelectMethod(rate);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'overnight':
        return <ThunderboltOutlined style={{ color: '#ff4d4f' }} />;
      case 'express':
      case 'international_express':
        return <RocketOutlined style={{ color: '#1890ff' }} />;
      case 'international':
        return <GlobalOutlined style={{ color: '#52c41a' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, string> = {
      in_house: 'JustSell Shipping',
      dhl: 'DHL Express',
      fedex: 'FedEx',
      ups: 'UPS',
      usps: 'USPS',
      sf_express: 'SF Express',
      china_post: 'China Post',
      ems: 'EMS',
      aramex: 'Aramex',
      tnt: 'TNT',
    };
    return labels[provider] || provider.toUpperCase();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      standard: 'Standard',
      express: 'Express',
      overnight: 'Overnight',
      international: 'International Standard',
      international_express: 'International Express',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      standard: 'default',
      express: 'blue',
      overnight: 'red',
      international: 'green',
      international_express: 'purple',
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Calculating shipping rates...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (rates.length === 0) {
    return (
      <Card>
        <Empty
          description="No shipping methods available for this route"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const isInternational = origin.country !== destination.country;

  return (
    <Card title={<Title level={4}>Select Shipping Method</Title>}>
      {isInternational && (
        <Alert
          message="International Shipping"
          description="This shipment requires international delivery. Additional customs fees may apply."
          type="info"
          showIcon
          icon={<GlobalOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Radio.Group
        value={selectedRate}
        onChange={(e) => handleSelectRate(e.target.value)}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {rates.map((rate) => (
            <Card
              key={rate.provider}
              size="small"
              hoverable
              style={{
                cursor: 'pointer',
                borderColor: selectedRate === rate.provider ? '#1890ff' : '#d9d9d9',
                borderWidth: selectedRate === rate.provider ? 2 : 1,
              }}
              onClick={() => handleSelectRate(rate.provider)}
            >
              <Radio value={rate.provider} style={{ width: '100%' }}>
                <Row align="middle" justify="space-between" style={{ width: '100%' }}>
                  <Col span={16}>
                    <Space direction="vertical" size={4}>
                      <Space>
                        {getProviderIcon(rate.type)}
                        <Text strong style={{ fontSize: 16 }}>
                          {getProviderLabel(rate.provider)}
                        </Text>
                        <Tag color={getTypeColor(rate.type)}>
                          {getTypeLabel(rate.type)}
                        </Tag>
                      </Space>
                      <Space>
                        <ClockCircleOutlined style={{ fontSize: 12 }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {rate.estimatedDays === 1
                            ? '1 business day'
                            : `${rate.estimatedDays} business days`}
                        </Text>
                      </Space>
                      {rate.description && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {rate.description}
                        </Text>
                      )}
                    </Space>
                  </Col>
                  <Col span={8} style={{ textAlign: 'right' }}>
                    <Space direction="vertical" size={0} align="end">
                      <Text strong style={{ fontSize: 20, color: '#1890ff' }}>
                        ${rate.cost.toFixed(2)}
                      </Text>
                      {rate.cost < 10 && (
                        <Tag color="success" style={{ margin: 0 }}>
                          Best Value
                        </Tag>
                      )}
                    </Space>
                  </Col>
                </Row>
              </Radio>
            </Card>
          ))}
        </Space>
      </Radio.Group>

      <Divider />

      <Row gutter={16}>
        <Col span={12}>
          <Space direction="vertical" size={0}>
            <Text type="secondary">From:</Text>
            <Text>
              {origin.postalCode}, {origin.country}
            </Text>
          </Space>
        </Col>
        <Col span={12}>
          <Space direction="vertical" size={0}>
            <Text type="secondary">To:</Text>
            <Text>
              {destination.postalCode}, {destination.country}
            </Text>
          </Space>
        </Col>
      </Row>

      <Divider />

      <Row gutter={16}>
        <Col span={12}>
          <Space direction="vertical" size={0}>
            <Text type="secondary">Package Weight:</Text>
            <Text>{packageDimensions.weight} kg</Text>
          </Space>
        </Col>
        {packageDimensions.length && packageDimensions.width && packageDimensions.height && (
          <Col span={12}>
            <Space direction="vertical" size={0}>
              <Text type="secondary">Dimensions:</Text>
              <Text>
                {packageDimensions.length} × {packageDimensions.width} ×{' '}
                {packageDimensions.height} cm
              </Text>
            </Space>
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default ShippingMethodSelector;
