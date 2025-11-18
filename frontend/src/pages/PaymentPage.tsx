import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Typography, Steps, Space, Button, Divider, Descriptions, Result } from 'antd';
import { LeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { PaymentMethodSelector, PaymentProcessor } from '../components/payment';

const { Title, Text } = Typography;
const { Step } = Steps;

interface PaymentPageState {
  orderId: string;
  orderNumber?: string;
  amount: number;
  currency?: string;
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PaymentPageState;

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<any>(null);

  if (!state || !state.orderId) {
    navigate('/orders');
    return null;
  }

  const handlePaymentMethodChange = (provider: string, method: string) => {
    setSelectedProvider(provider);
    setSelectedMethod(method);
  };

  const handleContinueToPayment = () => {
    if (selectedProvider && selectedMethod) {
      setCurrentStep(1);
    }
  };

  const handlePaymentSuccess = (payment: any) => {
    setCompletedPayment(payment);
    setPaymentCompleted(true);
    setCurrentStep(2);
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const handleViewOrder = () => {
    navigate(`/orders/${state.orderId}`);
  };

  const handleViewOrders = () => {
    navigate('/orders');
  };

  if (paymentCompleted) {
    return (
      <div className="container">
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="Payment Successful!"
          subTitle={
            <Space direction="vertical" align="center">
              <Text>Your payment has been processed successfully.</Text>
              <Text type="secondary">
                Order #{state.orderNumber || state.orderId.slice(0, 8)}
              </Text>
              <Text type="secondary">
                Amount: ${state.amount.toFixed(2)} {state.currency || 'USD'}
              </Text>
            </Space>
          }
          extra={[
            <Button type="primary" key="order" onClick={handleViewOrder}>
              View Order Details
            </Button>,
            <Button key="orders" onClick={handleViewOrders}>
              View All Orders
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="container">
      <Card>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          {/* Header */}
          <div>
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <Title level={2} style={{ marginTop: 16 }}>
              Complete Payment
            </Title>
          </div>

          {/* Steps */}
          <Steps current={currentStep} size="small">
            <Step title="Select Method" description="Choose payment method" />
            <Step title="Pay" description="Complete payment" />
            <Step title="Done" description="Payment confirmed" />
          </Steps>

          <Divider />

          {/* Order Summary */}
          <Card size="small" title="Order Summary">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Order Number">
                {state.orderNumber || state.orderId.slice(0, 8).toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                  ${state.amount.toFixed(2)} {state.currency || 'USD'}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Step Content */}
          {currentStep === 0 && (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Title level={4}>Select Payment Method</Title>
              <PaymentMethodSelector
                value={selectedProvider}
                onChange={handlePaymentMethodChange}
                currency={state.currency || 'USD'}
              />
              <Button
                type="primary"
                size="large"
                block
                onClick={handleContinueToPayment}
                disabled={!selectedProvider}
              >
                Continue to Payment
              </Button>
            </Space>
          )}

          {currentStep === 1 && (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <PaymentProcessor
                orderId={state.orderId}
                provider={selectedProvider}
                method={selectedMethod}
                returnUrl={`${window.location.origin}/payment/success`}
                cancelUrl={`${window.location.origin}/payment/cancel`}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handleBack}
              />
            </Space>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default PaymentPage;
