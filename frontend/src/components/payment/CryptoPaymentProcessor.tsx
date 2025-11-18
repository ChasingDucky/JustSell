import React, { useState, useEffect } from 'react';
import {
  Card,
  Space,
  Typography,
  Tabs,
  QRCode,
  Button,
  message,
  Tag,
  Statistic,
  Alert,
  Spin,
  Divider,
  Tooltip,
  Input,
} from 'antd';
import {
  CopyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface CryptoPaymentData {
  addresses: Record<string, string>;
  cryptoPrices: Record<string, number>;
  supportedCurrencies: string[];
  expiresAt: string;
}

interface CryptoPaymentProcessorProps {
  payment: any;
  onStatusChange?: (status: string) => void;
}

const CRYPTO_INFO: Record<string, { name: string; icon: string; color: string }> = {
  BTC: { name: 'Bitcoin', icon: '₿', color: '#f7931a' },
  ETH: { name: 'Ethereum', icon: 'Ξ', color: '#627eea' },
  USDT: { name: 'Tether', icon: '₮', color: '#26a17b' },
  USDC: { name: 'USD Coin', icon: '$', color: '#2775ca' },
  LTC: { name: 'Litecoin', icon: 'Ł', color: '#345d9d' },
  BCH: { name: 'Bitcoin Cash', icon: 'BCH', color: '#8dc351' },
};

const CryptoPaymentProcessor: React.FC<CryptoPaymentProcessorProps> = ({
  payment,
  onStatusChange,
}) => {
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTC');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const cryptoData = payment.metadata as CryptoPaymentData;

  useEffect(() => {
    if (!cryptoData?.supportedCurrencies?.length) return;
    setSelectedCrypto(cryptoData.supportedCurrencies[0]);
  }, [cryptoData]);

  useEffect(() => {
    if (!cryptoData?.expiresAt) return;

    const updateTimer = () => {
      const now = dayjs();
      const expires = dayjs(cryptoData.expiresAt);
      const diff = expires.diff(now);

      if (diff <= 0) {
        setTimeLeft(0);
        if (onStatusChange) {
          onStatusChange('expired');
        }
      } else {
        setTimeLeft(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [cryptoData?.expiresAt, onStatusChange]);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      message.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      message.error('Failed to copy address');
    }
  };

  const formatTime = (ms: number) => {
    const dur = dayjs.duration(ms);
    const minutes = Math.floor(dur.asMinutes());
    const seconds = dur.seconds();
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (timeLeft <= 0) return 'error';
    if (timeLeft < 300000) return 'warning'; // Less than 5 minutes
    return 'success';
  };

  if (!cryptoData || !cryptoData.addresses) {
    return (
      <Alert
        message="Payment Data Error"
        description="Unable to load cryptocurrency payment information"
        type="error"
        showIcon
      />
    );
  }

  const currentAddress = cryptoData.addresses[selectedCrypto];
  const currentPrice = cryptoData.cryptoPrices[selectedCrypto];
  const cryptoInfo = CRYPTO_INFO[selectedCrypto];

  return (
    <Card>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <Title level={3}>Pay with Cryptocurrency</Title>
          <Paragraph type="secondary">
            Choose your preferred cryptocurrency and send the exact amount to the address below
          </Paragraph>
        </div>

        {/* Timer */}
        {timeLeft > 0 ? (
          <Alert
            message={
              <Space>
                <ClockCircleOutlined />
                <Text>Time remaining: {formatTime(timeLeft)}</Text>
              </Space>
            }
            type={getStatusColor()}
            showIcon={false}
          />
        ) : (
          <Alert
            message="Payment Expired"
            description="This payment request has expired. Please create a new order."
            type="error"
            showIcon
            icon={<WarningOutlined />}
          />
        )}

        {/* Currency Tabs */}
        <Tabs
          activeKey={selectedCrypto}
          onChange={setSelectedCrypto}
          centered
          items={cryptoData.supportedCurrencies.map((crypto) => ({
            key: crypto,
            label: (
              <Space>
                <span style={{ fontSize: 20 }}>{CRYPTO_INFO[crypto]?.icon}</span>
                <span>{CRYPTO_INFO[crypto]?.name || crypto}</span>
              </Space>
            ),
            children: null,
          }))}
        />

        {/* Payment Amount */}
        <Card size="small" style={{ background: '#fafafa' }}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Text type="secondary">Send exactly:</Text>
            <Statistic
              value={currentPrice}
              precision={8}
              valueStyle={{
                fontSize: 28,
                fontWeight: 'bold',
                color: cryptoInfo?.color,
              }}
              suffix={
                <Space>
                  <span style={{ fontSize: 20 }}>{cryptoInfo?.icon}</span>
                  <Text>{selectedCrypto}</Text>
                </Space>
              }
            />
            <Alert
              message="Important"
              description="Send the exact amount shown above. Sending more or less may result in payment failure."
              type="warning"
              showIcon
              closable
            />
          </Space>
        </Card>

        <Divider>Payment Address</Divider>

        {/* QR Code */}
        <div style={{ textAlign: 'center' }}>
          <QRCode
            value={currentAddress}
            size={200}
            style={{ margin: '0 auto' }}
            icon={cryptoInfo?.icon}
          />
          <Paragraph type="secondary" style={{ marginTop: 16 }}>
            Scan with your {cryptoInfo?.name} wallet
          </Paragraph>
        </div>

        {/* Address */}
        <Card size="small">
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Text type="secondary">Or copy the address:</Text>
            <Input
              value={currentAddress}
              readOnly
              addonAfter={
                <Tooltip title={copied ? 'Copied!' : 'Copy address'}>
                  <Button
                    type="text"
                    icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
                    onClick={() => handleCopyAddress(currentAddress)}
                    style={{ border: 'none' }}
                  />
                </Tooltip>
              }
              style={{ fontFamily: 'monospace' }}
            />
          </Space>
        </Card>

        {/* Instructions */}
        <Card size="small" title="Payment Instructions">
          <Space direction="vertical" size={12}>
            <div>
              <Text strong>1. Send Payment</Text>
              <Paragraph type="secondary" style={{ marginLeft: 20, marginBottom: 0 }}>
                Send exactly {currentPrice?.toFixed(8)} {selectedCrypto} to the address above
              </Paragraph>
            </div>
            <div>
              <Text strong>2. Wait for Confirmation</Text>
              <Paragraph type="secondary" style={{ marginLeft: 20, marginBottom: 0 }}>
                Your payment will be confirmed after receiving blockchain confirmations (usually 6 blocks)
              </Paragraph>
            </div>
            <div>
              <Text strong>3. Receive Your Product</Text>
              <Paragraph type="secondary" style={{ marginLeft: 20, marginBottom: 0 }}>
                Once confirmed, your order will be processed and you'll receive your product
              </Paragraph>
            </div>
          </Space>
        </Card>

        {/* Network Fee Warning */}
        <Alert
          message="Network Fees"
          description="Please ensure you include sufficient network fees for your transaction to be confirmed promptly."
          type="info"
          showIcon
          icon={<WalletOutlined />}
        />

        {/* Status */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Spin />
            <Text type="secondary">Waiting for payment...</Text>
          </Space>
          <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
            This page will automatically update when payment is received
          </Paragraph>
        </div>

        {/* Supported Networks */}
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Supported cryptocurrencies:
          </Text>
          <div style={{ marginTop: 8 }}>
            <Space wrap>
              {cryptoData.supportedCurrencies.map((crypto) => (
                <Tag key={crypto} color={CRYPTO_INFO[crypto]?.color}>
                  {CRYPTO_INFO[crypto]?.icon} {crypto}
                </Tag>
              ))}
            </Space>
          </div>
        </div>
      </Space>
    </Card>
  );
};

export default CryptoPaymentProcessor;
