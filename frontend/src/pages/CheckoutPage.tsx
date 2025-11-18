import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card,
  Typography,
  Steps,
  Form,
  Input,
  Radio,
  Button,
  Row,
  Col,
  Divider,
  Space,
  List,
  message,
  Alert,
} from 'antd';
import {
  CreditCardOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import { clearCart } from '../store/slices/cartSlice';
import api from '../services/api';

const { Title, Text } = Typography;
const { Step } = Steps;

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'sms' | 'app'>('email');
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [deliveryInfo, setDeliveryInfo] = useState({
    email: user?.email || '',
    phone: '',
  });

  const [form] = Form.useForm();

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleDeliveryInfoSubmit = (values: any) => {
    setDeliveryInfo(values);
    setCurrentStep(1);
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create orders for each item in cart
      const orderPromises = items.map((item) =>
        api.createOrder({
          cardId: item.cardId,
          quantity: item.quantity,
          deliveryEmail: deliveryMethod === 'email' ? deliveryInfo.email : undefined,
          deliveryPhone: deliveryMethod === 'sms' ? deliveryInfo.phone : undefined,
          deliveryMethod,
        })
      );

      const orders = await Promise.all(orderPromises);

      // Process payment for each order
      for (const orderResponse of orders) {
        const order = orderResponse.data;

        // Create payment
        const paymentResponse = await api.createPayment({
          orderId: order.id,
          method: paymentMethod === 'stripe' ? 'card' : 'wallet',
          provider: paymentMethod,
        });

        const payment = paymentResponse.data;

        // Simulate payment processing
        if (paymentMethod === 'stripe') {
          await api.processStripePayment(payment.id, 'tok_visa'); // Mock token
        } else if (paymentMethod === 'paypal') {
          await api.processPayPalPayment(payment.id, `PP-${Date.now()}`);
        }
      }

      message.success('Payment successful!');
      dispatch(clearCart());
      setCurrentStep(2);
    } catch (error: any) {
      console.error('Payment failed:', error);
      message.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDeliveryInfo = () => (
    <Card title="Delivery Information">
      <Form
        form={form}
        layout="vertical"
        initialValues={deliveryInfo}
        onFinish={handleDeliveryInfoSubmit}
      >
        <Form.Item label="Delivery Method">
          <Radio.Group
            value={deliveryMethod}
            onChange={(e) => setDeliveryMethod(e.target.value)}
          >
            <Radio.Button value="email">📧 Email</Radio.Button>
            <Radio.Button value="sms">📱 SMS</Radio.Button>
            <Radio.Button value="app">📲 In-App</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {deliveryMethod === 'email' && (
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="your@email.com"
              size="large"
            />
          </Form.Item>
        )}

        {deliveryMethod === 'sms' && (
          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please enter your phone number' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="+1234567890"
              size="large"
            />
          </Form.Item>
        )}

        {deliveryMethod === 'app' && (
          <Alert
            message="Cards will be delivered to your account"
            description="You can view your cards in the 'My Orders' section after purchase."
            type="info"
            showIcon
          />
        )}

        <Form.Item style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" size="large" block>
            Continue to Payment
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const renderPaymentMethod = () => (
    <Card title="Payment Method">
      <Radio.Group
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Card
            hoverable
            onClick={() => setPaymentMethod('stripe')}
            style={{
              border: paymentMethod === 'stripe' ? '2px solid #1890ff' : '1px solid #d9d9d9',
            }}
          >
            <Radio value="stripe">
              <Space>
                <CreditCardOutlined style={{ fontSize: 24 }} />
                <div>
                  <div><strong>Credit/Debit Card</strong></div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Powered by Stripe
                  </Text>
                </div>
              </Space>
            </Radio>
          </Card>

          <Card
            hoverable
            onClick={() => setPaymentMethod('paypal')}
            style={{
              border: paymentMethod === 'paypal' ? '2px solid #1890ff' : '1px solid #d9d9d9',
            }}
          >
            <Radio value="paypal">
              <Space>
                <span style={{ fontSize: 24 }}>💰</span>
                <div>
                  <div><strong>PayPal</strong></div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Pay with PayPal
                  </Text>
                </div>
              </Space>
            </Radio>
          </Card>

          <Card
            hoverable
            onClick={() => setPaymentMethod('alipay')}
            style={{
              border: paymentMethod === 'alipay' ? '2px solid #1890ff' : '1px solid #d9d9d9',
            }}
          >
            <Radio value="alipay">
              <Space>
                <span style={{ fontSize: 24 }}>🏦</span>
                <div>
                  <div><strong>Alipay</strong></div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    支付宝支付
                  </Text>
                </div>
              </Space>
            </Radio>
          </Card>

          <Card
            hoverable
            onClick={() => setPaymentMethod('wechat')}
            style={{
              border: paymentMethod === 'wechat' ? '2px solid #1890ff' : '1px solid #d9d9d9',
            }}
          >
            <Radio value="wechat">
              <Space>
                <span style={{ fontSize: 24 }}>💚</span>
                <div>
                  <div><strong>WeChat Pay</strong></div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    微信支付
                  </Text>
                </div>
              </Space>
            </Radio>
          </Card>
        </Space>
      </Radio.Group>

      <Space direction="vertical" style={{ width: '100%', marginTop: 24 }} size={16}>
        <Button type="default" size="large" block onClick={() => setCurrentStep(0)}>
          Back
        </Button>
        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          onClick={handlePayment}
        >
          Pay ${total.toFixed(2)}
        </Button>
      </Space>
    </Card>
  );

  const renderSuccess = () => (
    <Card>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <CheckCircleOutlined
          style={{ fontSize: 72, color: '#52c41a', marginBottom: 24 }}
        />
        <Title level={2}>Order Successful!</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Your cards will be delivered to your {deliveryMethod} shortly.
        </Text>

        <Divider />

        <Space direction="vertical" size={16} style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
          <Button type="primary" size="large" block onClick={() => navigate('/orders')}>
            View My Orders
          </Button>
          <Button size="large" block onClick={() => navigate('/')}>
            Continue Shopping
          </Button>
        </Space>
      </div>
    </Card>
  );

  return (
    <div className="container">
      <Title level={2}>Checkout</Title>

      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        <Step title="Delivery Info" />
        <Step title="Payment" />
        <Step title="Complete" />
      </Steps>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {currentStep === 0 && renderDeliveryInfo()}
          {currentStep === 1 && renderPaymentMethod()}
          {currentStep === 2 && renderSuccess()}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Order Summary">
            <List
              dataSource={items}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.name}
                    description={`Qty: ${item.quantity} × $${item.price.toFixed(2)}`}
                  />
                  <Text strong>${(item.price * item.quantity).toFixed(2)}</Text>
                </List.Item>
              )}
            />

            <Divider />

            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Text>Subtotal:</Text>
              <Text>${total.toFixed(2)}</Text>
            </Row>
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Text>Tax:</Text>
              <Text>$0.00</Text>
            </Row>
            <Row justify="space-between" style={{ marginBottom: 16 }}>
              <Text>Shipping:</Text>
              <Text style={{ color: '#52c41a' }}>FREE</Text>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            <Row justify="space-between">
              <Title level={4} style={{ margin: 0 }}>
                Total:
              </Title>
              <Title level={4} style={{ margin: 0, color: '#f5222d' }}>
                ${total.toFixed(2)}
              </Title>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CheckoutPage;
