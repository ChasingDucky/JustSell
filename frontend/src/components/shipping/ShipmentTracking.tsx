import React, { useState, useEffect } from 'react';
import {
  Card,
  Timeline,
  Typography,
  Space,
  Tag,
  Row,
  Col,
  Divider,
  Button,
  Input,
  message,
  Spin,
  Empty,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
  RocketOutlined,
  HomeOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface TrackingEvent {
  timestamp: Date;
  status: string;
  location: string;
  description: string;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  provider: string;
  type: string;
  status: string;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  cost: number;
  estimatedDeliveryDate?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  trackingEvents: TrackingEvent[];
  originAddress: string;
  destinationAddress: string;
}

interface ShipmentTrackingProps {
  trackingNumber?: string;
  shipmentId?: string;
}

const ShipmentTracking: React.FC<ShipmentTrackingProps> = ({
  trackingNumber: initialTrackingNumber,
  shipmentId,
}) => {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(
    initialTrackingNumber || ''
  );

  useEffect(() => {
    if (initialTrackingNumber || shipmentId) {
      loadShipment();
    }
  }, [initialTrackingNumber, shipmentId]);

  const loadShipment = async (customTrackingNumber?: string) => {
    try {
      setLoading(true);
      const numberToTrack = customTrackingNumber || trackingNumber;
      if (!numberToTrack) {
        message.warning('Please enter a tracking number');
        return;
      }

      const response = await api.trackShipment(numberToTrack);
      if (response.success) {
        setShipment(response.data);
      }
    } catch (error) {
      message.error('Shipment not found');
      setShipment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadShipment();
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
      case 'out_for_delivery':
        return <CarOutlined style={{ color: '#1890ff', fontSize: 24 }} />;
      case 'in_transit':
        return <RocketOutlined style={{ color: '#1890ff', fontSize: 24 }} />;
      case 'picked_up':
        return <HomeOutlined style={{ color: '#722ed1', fontSize: 24 }} />;
      case 'processing':
        return <ClockCircleOutlined style={{ color: '#faad14', fontSize: 24 }} />;
      case 'failed':
      case 'returned':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
      case 'cancelled':
        return <CloseCircleOutlined style={{ color: '#8c8c8c', fontSize: 24 }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#8c8c8c', fontSize: 24 }} />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'default',
      processing: 'processing',
      picked_up: 'purple',
      in_transit: 'blue',
      out_for_delivery: 'cyan',
      delivered: 'success',
      failed: 'error',
      returned: 'warning',
      cancelled: 'default',
    };
    return colors[status.toLowerCase()] || 'default';
  };

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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

  const getEventIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'out_for_delivery':
        return <CarOutlined style={{ color: '#1890ff' }} />;
      case 'in_transit':
        return <RocketOutlined style={{ color: '#1890ff' }} />;
      case 'picked_up':
        return <HomeOutlined style={{ color: '#722ed1' }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  return (
    <div>
      {!initialTrackingNumber && !shipmentId && (
        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={4}>Track Your Shipment</Title>
              <Text type="secondary">
                Enter your tracking number to see the latest status
              </Text>
            </div>
            <Input.Search
              placeholder="Enter tracking number"
              size="large"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onSearch={handleSearch}
              enterButton={
                <Button type="primary" icon={<SearchOutlined />}>
                  Track
                </Button>
              }
              loading={loading}
            />
          </Space>
        </Card>
      )}

      {loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Loading shipment details...</Text>
            </div>
          </div>
        </Card>
      )}

      {!loading && shipment && (
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Status Overview */}
            <Row align="middle" gutter={24}>
              <Col span={4} style={{ textAlign: 'center' }}>
                {getStatusIcon(shipment.status)}
              </Col>
              <Col span={20}>
                <Space direction="vertical" size={4}>
                  <Space>
                    <Tag color={getStatusColor(shipment.status)} style={{ fontSize: 14 }}>
                      {getStatusLabel(shipment.status)}
                    </Tag>
                    <Text type="secondary">
                      Tracking #: {shipment.trackingNumber}
                    </Text>
                  </Space>
                  <Title level={4} style={{ margin: 0 }}>
                    {getProviderLabel(shipment.provider)}
                  </Title>
                  {shipment.estimatedDeliveryDate && (
                    <Text type="secondary">
                      Estimated Delivery:{' '}
                      {dayjs(shipment.estimatedDeliveryDate).format('MMM DD, YYYY')}
                    </Text>
                  )}
                </Space>
              </Col>
            </Row>

            {shipment.status === 'delivered' && (
              <Alert
                message="Package Delivered!"
                description={`Your package was delivered on ${dayjs(
                  shipment.deliveredAt
                ).format('MMM DD, YYYY [at] h:mm A')}`}
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            )}

            {shipment.status === 'failed' && (
              <Alert
                message="Delivery Failed"
                description="There was an issue delivering your package. Please contact customer support."
                type="error"
                showIcon
                icon={<WarningOutlined />}
              />
            )}

            <Divider />

            {/* Shipping Details */}
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="From">
                  <Text>{shipment.originAddress}</Text>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="To">
                  <Text>{shipment.destinationAddress}</Text>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary">Package Weight</Text>
                  <Text strong>{shipment.weight} kg</Text>
                </Space>
              </Col>
              {shipment.length && shipment.width && shipment.height && (
                <Col xs={24} sm={8}>
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">Dimensions</Text>
                    <Text strong>
                      {shipment.length} × {shipment.width} × {shipment.height} cm
                    </Text>
                  </Space>
                </Col>
              )}
              <Col xs={24} sm={8}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary">Shipping Cost</Text>
                  <Text strong>${shipment.cost.toFixed(2)}</Text>
                </Space>
              </Col>
            </Row>

            <Divider />

            {/* Tracking Timeline */}
            <div>
              <Title level={5}>Tracking History</Title>
              {shipment.trackingEvents && shipment.trackingEvents.length > 0 ? (
                <Timeline mode="left">
                  {shipment.trackingEvents
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((event, index) => (
                      <Timeline.Item
                        key={index}
                        dot={getEventIcon(event.status)}
                        color={getStatusColor(event.status)}
                      >
                        <Space direction="vertical" size={2}>
                          <Text strong>{getStatusLabel(event.status)}</Text>
                          <Text type="secondary">
                            {dayjs(event.timestamp).format('MMM DD, YYYY [at] h:mm A')}
                          </Text>
                          <Text>{event.description}</Text>
                          {event.location && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Location: {event.location}
                            </Text>
                          )}
                        </Space>
                      </Timeline.Item>
                    ))}
                </Timeline>
              ) : (
                <Empty description="No tracking events yet" />
              )}
            </div>
          </Space>
        </Card>
      )}

      {!loading && !shipment && trackingNumber && (
        <Card>
          <Empty
            description="Shipment not found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Text type="secondary">
              Please check your tracking number and try again
            </Text>
          </Empty>
        </Card>
      )}
    </div>
  );
};

export default ShipmentTracking;
