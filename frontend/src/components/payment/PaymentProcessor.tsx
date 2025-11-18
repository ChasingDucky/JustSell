import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Alert, Spin, Result, QRCode, message } from 'antd';
import { CheckCircleOutlined, LoadingOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;

interface PaymentProcessorProps {
  orderId: string;
  provider: string;
  method: string;
  returnUrl?: string;
  cancelUrl?: string;
  onSuccess?: (payment: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  orderId,
  provider,
  method,
  returnUrl,
  cancelUrl,
  onSuccess,
  onError,
  onCancel,
}) => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    initializePayment();
  }, [orderId, provider]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create payment
      const response = await api.createPayment({
        orderId,
        provider,
        method,
        returnUrl,
        cancelUrl,
      });

      if (response.success) {
        setPayment(response.data.payment);
        setPaymentUrl(response.data.paymentUrl || '');
        setQrCode(response.data.qrCode || '');

        // Auto-process for card payments (Stripe)
        if (provider === 'stripe' && response.data.clientSecret) {
          // In production, you would integrate Stripe Elements here
          message.info('Redirecting to Stripe payment...');
          setTimeout(() => {
            processPayment(response.data.payment.id);
          }, 1000);
        }
      } else {
        throw new Error(response.message || 'Failed to create payment');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to initialize payment';
      setError(errorMsg);
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (paymentId?: string) => {
    try {
      setProcessing(true);
      const id = paymentId || payment?.id;

      if (!id) {
        throw new Error('Payment ID not found');
      }

      const response = await api.processPayment(id);

      if (response.success) {
        message.success('Payment completed successfully!');
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        throw new Error(response.message || 'Payment processing failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Payment processing failed';
      setError(errorMsg);
      message.error(errorMsg);
      if (onError) {
        onError(err);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleExternalPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      // Poll for payment status
      startPolling();
    }
  };

  const startPolling = () => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for 5 minutes (every 5 seconds)

    const interval = setInterval(async () => {
      attempts++;

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setError('Payment timeout. Please check your payment status.');
        return;
      }

      try {
        const response = await api.getPaymentById(payment.id);
        if (response.success && response.data.status === 'completed') {
          clearInterval(interval);
          message.success('Payment completed!');
          if (onSuccess) {
            onSuccess(response.data);
          }
        }
      } catch (err) {
        // Continue polling
      }
    }, 5000);
  };

  if (loading) {
    return (
      <Card>
        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <Spin size="large" />
          <Text>Initializing payment...</Text>
        </Space>
      </Card>
    );
  }

  if (error && !payment) {
    return (
      <Result
        status="error"
        title="Payment Initialization Failed"
        subTitle={error}
        extra={[
          <Button key="retry" type="primary" onClick={initializePayment}>
            Try Again
          </Button>,
          onCancel && (
            <Button key="cancel" onClick={onCancel}>
              Cancel
            </Button>
          ),
        ]}
      />
    );
  }

  // Card payment (Stripe)
  if (provider === 'stripe') {
    return (
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Title level={4}>Card Payment</Title>
          {processing ? (
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
              <Text>Processing payment...</Text>
              <Text type="secondary">Please do not close this window</Text>
            </Space>
          ) : error ? (
            <Alert
              message="Payment Failed"
              description={error}
              type="error"
              showIcon
              icon={<CloseCircleOutlined />}
              action={
                <Button size="small" type="primary" onClick={() => processPayment()}>
                  Retry
                </Button>
              }
            />
          ) : (
            <Alert
              message="Payment Processing"
              description="Your payment is being processed. This is a demo mode."
              type="info"
              showIcon
            />
          )}
        </Space>
      </Card>
    );
  }

  // QR Code payment (WeChat, Alipay)
  if (qrCode) {
    return (
      <Card>
        <Space direction="vertical" align="center" size={16} style={{ width: '100%' }}>
          <Title level={4}>Scan to Pay</Title>
          <QRCode value={qrCode} size={200} />
          <Text>Scan this QR code with your {provider} app</Text>
          <Spin tip="Waiting for payment..." />
          {error && <Alert message={error} type="error" showIcon />}
        </Space>
      </Card>
    );
  }

  // Redirect payment (PayPal, External)
  if (paymentUrl) {
    return (
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Title level={4}>Complete Payment</Title>
          <Paragraph>
            You will be redirected to {provider} to complete your payment.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            block
            onClick={handleExternalPayment}
            loading={processing}
          >
            Continue to {provider}
          </Button>
          {onCancel && (
            <Button block onClick={onCancel}>
              Cancel
            </Button>
          )}
          {error && <Alert message={error} type="error" showIcon />}
        </Space>
      </Card>
    );
  }

  return null;
};

export default PaymentProcessor;
