import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  Typography,
  Descriptions,
  Tag,
  Button,
  Space,
  Spin,
  Alert,
  Divider,
  Row,
  Col,
  message,
  Modal,
  List,
} from 'antd';
import {
  ArrowLeftOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import { Order } from '../types';

const { Title, Text, Paragraph } = Typography;

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardCodes, setCardCodes] = useState<any[]>([]);
  const [showCodes, setShowCodes] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await api.getOrderById(id!);

      if (response.success) {
        setOrder(response.data);
        if (response.data.cardCodes) {
          setCardCodes(response.data.cardCodes);
        }
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      message.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success('Code copied to clipboard!');
  };

  const getStatusColor = (status: Order['status']) => {
    const colors: Record<Order['status'], string> = {
      pending: 'orange',
      paid: 'blue',
      processing: 'cyan',
      completed: 'green',
      cancelled: 'red',
      refunded: 'purple',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: Order['status']) => {
    if (status === 'completed') {
      return <CheckCircleOutlined />;
    }
    return <ClockCircleOutlined />;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container">
        <Card>
          <Alert
            message="Order not found"
            description="The order you're looking for doesn't exist."
            type="error"
            showIcon
            action={
              <Link to="/orders">
                <Button size="small">Back to Orders</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="container">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/orders')}
        style={{ marginBottom: 16 }}
      >
        Back to Orders
      </Button>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title={`Order ${order.orderNumber}`}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Tag color={getStatusColor(order.status)} icon={getStatusIcon(order.status)} style={{ fontSize: 16, padding: '4px 12px' }}>
                  {order.status.toUpperCase()}
                </Tag>
                <Text type="secondary">
                  Placed on {dayjs(order.createdAt).format('MMMM D, YYYY [at] h:mm A')}
                </Text>
              </div>

              <Divider />

              <Descriptions title="Order Details" column={1} bordered>
                <Descriptions.Item label="Order Number">
                  {order.orderNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Card">
                  {order.card ? (
                    <Link to={`/cards/${order.card.id}`}>{order.card.name}</Link>
                  ) : (
                    'N/A'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Quantity">
                  {order.quantity}
                </Descriptions.Item>
                <Descriptions.Item label="Unit Price">
                  ${order.unitPrice.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Total Amount">
                  ${order.totalAmount.toFixed(2)}
                </Descriptions.Item>
                {order.discount > 0 && (
                  <Descriptions.Item label="Discount">
                    -${order.discount.toFixed(2)}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Final Amount">
                  <Text strong style={{ fontSize: 18, color: '#f5222d' }}>
                    ${order.finalAmount.toFixed(2)} {order.currency}
                  </Text>
                </Descriptions.Item>
                {order.paymentMethod && (
                  <Descriptions.Item label="Payment Method">
                    {order.paymentMethod.toUpperCase()}
                  </Descriptions.Item>
                )}
                {order.deliveryEmail && (
                  <Descriptions.Item label="Delivery Email">
                    {order.deliveryEmail}
                  </Descriptions.Item>
                )}
                {order.deliveryPhone && (
                  <Descriptions.Item label="Delivery Phone">
                    {order.deliveryPhone}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {order.status === 'completed' && cardCodes.length > 0 && (
                <>
                  <Divider />
                  <div>
                    <Title level={4}>Your Card Codes</Title>
                    <Alert
                      message="Important"
                      description="Please keep your card codes safe. Do not share them with anyone."
                      type="warning"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />

                    {showCodes ? (
                      <List
                        bordered
                        dataSource={cardCodes}
                        renderItem={(code: any) => (
                          <List.Item
                            actions={[
                              <Button
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyCode(code.code)}
                              >
                                Copy
                              </Button>,
                            ]}
                          >
                            <List.Item.Meta
                              title="Card Code"
                              description={
                                <Space direction="vertical">
                                  <Text code style={{ fontSize: 16 }}>
                                    {code.code}
                                  </Text>
                                  {code.pin && (
                                    <Text type="secondary">
                                      PIN: <Text code>{code.pin}</Text>
                                    </Text>
                                  )}
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Button
                        type="primary"
                        size="large"
                        block
                        onClick={() => setShowCodes(true)}
                      >
                        View Card Codes
                      </Button>
                    )}
                  </div>
                </>
              )}

              {order.status === 'pending' && (
                <Alert
                  message="Pending Payment"
                  description="Your order is waiting for payment. Please complete the payment to receive your cards."
                  type="info"
                  showIcon
                />
              )}

              {order.status === 'processing' && (
                <Alert
                  message="Processing Order"
                  description="We are processing your order. Your cards will be delivered shortly."
                  type="info"
                  showIcon
                />
              )}

              {order.status === 'cancelled' && (
                <Alert
                  message="Order Cancelled"
                  description={`This order was cancelled on ${dayjs(order.cancelledAt).format('MMMM D, YYYY')}.`}
                  type="error"
                  showIcon
                />
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Order Summary">
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Row justify="space-between">
                <Text>Items ({order.quantity}):</Text>
                <Text>${order.totalAmount.toFixed(2)}</Text>
              </Row>

              {order.discount > 0 && (
                <Row justify="space-between">
                  <Text>Discount:</Text>
                  <Text style={{ color: '#52c41a' }}>
                    -${order.discount.toFixed(2)}
                  </Text>
                </Row>
              )}

              <Row justify="space-between">
                <Text>Tax:</Text>
                <Text>$0.00</Text>
              </Row>

              <Row justify="space-between">
                <Text>Delivery:</Text>
                <Text style={{ color: '#52c41a' }}>FREE</Text>
              </Row>

              <Divider style={{ margin: '8px 0' }} />

              <Row justify="space-between">
                <Title level={4} style={{ margin: 0 }}>
                  Total Paid:
                </Title>
                <Title level={4} style={{ margin: 0, color: '#f5222d' }}>
                  ${order.finalAmount.toFixed(2)}
                </Title>
              </Row>

              {order.status === 'completed' && (
                <Alert
                  message="Order Completed"
                  description={`Completed on ${dayjs(order.completedAt).format('MMM D, YYYY')}`}
                  type="success"
                  showIcon
                />
              )}
            </Space>
          </Card>

          <Card title="Need Help?" style={{ marginTop: 16 }}>
            <Space direction="vertical" size={12}>
              <Paragraph>
                If you have any questions about your order, please contact our support team.
              </Paragraph>
              <Button type="primary" block>
                Contact Support
              </Button>
              <Link to="/orders">
                <Button block>View All Orders</Button>
              </Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OrderDetailPage;
