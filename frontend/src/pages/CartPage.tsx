import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card,
  Typography,
  Empty,
  List,
  Button,
  InputNumber,
  Space,
  Divider,
  Row,
  Col,
  message,
  Popconfirm,
} from 'antd';
import { DeleteOutlined, ShoppingOutlined } from '@ant-design/icons';
import { RootState } from '../store';
import { removeFromCart, updateQuantity, clearCart } from '../store/slices/cartSlice';

const { Title, Text } = Typography;

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state: RootState) => state.cart);

  const handleQuantityChange = (cardId: string, quantity: number) => {
    if (quantity > 0) {
      dispatch(updateQuantity({ cardId, quantity }));
    }
  };

  const handleRemove = (cardId: string) => {
    dispatch(removeFromCart(cardId));
    message.success('Item removed from cart');
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    message.success('Cart cleared');
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      message.warning('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="container">
        <Card>
          <Empty
            description="Your cart is empty"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Link to="/search">
              <Button type="primary" icon={<ShoppingOutlined />}>
                Start Shopping
              </Button>
            </Link>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="container">
      <Title level={2}>Shopping Cart</Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={`Cart Items (${items.length})`}
            extra={
              <Popconfirm
                title="Are you sure you want to clear the cart?"
                onConfirm={handleClearCart}
                okText="Yes"
                cancelText="No"
              >
                <Button danger>Clear Cart</Button>
              </Popconfirm>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={items}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      title="Remove this item?"
                      onConfirm={() => handleRemove(item.cardId)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        Remove
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          background: '#f0f2f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 8,
                        }}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                          />
                        ) : (
                          <span style={{ fontSize: 32 }}>💳</span>
                        )}
                      </div>
                    }
                    title={
                      <Link to={`/cards/${item.cardId}`}>{item.name}</Link>
                    }
                    description={
                      <Space direction="vertical" size={8}>
                        <Text strong style={{ fontSize: 18, color: '#f5222d' }}>
                          ${item.price.toFixed(2)}
                        </Text>
                        <Space>
                          <Text>Quantity:</Text>
                          <InputNumber
                            min={1}
                            max={10}
                            value={item.quantity}
                            onChange={(value) =>
                              handleQuantityChange(item.cardId, value || 1)
                            }
                            style={{ width: 80 }}
                          />
                        </Space>
                        <Text strong>
                          Subtotal: ${(item.price * item.quantity).toFixed(2)}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Order Summary">
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <Row justify="space-between">
                  <Text>Items ({items.length}):</Text>
                  <Text>${total.toFixed(2)}</Text>
                </Row>
                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <Text>Shipping:</Text>
                  <Text style={{ color: '#52c41a' }}>FREE</Text>
                </Row>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <Row justify="space-between">
                <Title level={4} style={{ margin: 0 }}>
                  Total:
                </Title>
                <Title level={4} style={{ margin: 0, color: '#f5222d' }}>
                  ${total.toFixed(2)}
                </Title>
              </Row>

              <Button
                type="primary"
                size="large"
                block
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>

              <Link to="/search">
                <Button block>Continue Shopping</Button>
              </Link>
            </Space>
          </Card>

          <Card title="We Accept" style={{ marginTop: 16 }}>
            <Space wrap size="large">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32 }}>💳</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Credit Card
                </Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32 }}>💰</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  PayPal
                </Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32 }}>🏦</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Alipay
                </Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32 }}>💚</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  WeChat Pay
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CartPage;
