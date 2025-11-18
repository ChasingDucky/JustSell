import React, { useEffect, useState } from 'react';
import { Radio, Card, Space, Typography, Tag, Spin, Alert } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Text } = Typography;

interface PaymentMethod {
  provider: string;
  name: string;
  method: string;
  icon: string;
  enabled: boolean;
  description: string;
  currencies: string[];
}

interface PaymentMethodSelectorProps {
  value?: string;
  onChange?: (provider: string, method: string) => void;
  currency?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  currency = 'USD',
}) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>(value || '');

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await api.getPaymentMethods();
      if (response.success) {
        setMethods(response.data);
        // Auto-select first enabled method if none selected
        if (!selectedProvider && response.data.length > 0) {
          const firstEnabled = response.data.find((m: PaymentMethod) => m.enabled);
          if (firstEnabled && onChange) {
            setSelectedProvider(firstEnabled.provider);
            onChange(firstEnabled.provider, firstEnabled.method);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (provider: string) => {
    const method = methods.find((m) => m.provider === provider);
    if (method && onChange) {
      setSelectedProvider(provider);
      onChange(provider, method.method);
    }
  };

  const isMethodAvailable = (method: PaymentMethod) => {
    return method.enabled && method.currencies.includes(currency);
  };

  if (loading) {
    return (
      <Card>
        <Spin tip="Loading payment methods..." />
      </Card>
    );
  }

  const availableMethods = methods.filter(isMethodAvailable);
  const unavailableMethods = methods.filter((m) => !isMethodAvailable(m));

  if (availableMethods.length === 0) {
    return (
      <Alert
        message="No Payment Methods Available"
        description="No payment methods are currently available for your currency. Please contact support."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Radio.Group
        value={selectedProvider}
        onChange={(e) => handleSelect(e.target.value)}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {availableMethods.map((method) => (
            <Card
              key={method.provider}
              hoverable
              className={selectedProvider === method.provider ? 'payment-method-selected' : ''}
              style={{
                borderColor: selectedProvider === method.provider ? '#1890ff' : undefined,
                borderWidth: selectedProvider === method.provider ? 2 : 1,
              }}
              onClick={() => handleSelect(method.provider)}
            >
              <Radio value={method.provider} style={{ width: '100%' }}>
                <Space align="start" style={{ width: '100%' }}>
                  <span style={{ fontSize: 32 }}>{method.icon}</span>
                  <Space direction="vertical" size={0} style={{ flex: 1 }}>
                    <Space>
                      <Text strong>{method.name}</Text>
                      {selectedProvider === method.provider && (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      )}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {method.description}
                    </Text>
                    <Space size={4}>
                      {method.currencies.map((curr) => (
                        <Tag key={curr} size="small">
                          {curr}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                </Space>
              </Radio>
            </Card>
          ))}
        </Space>
      </Radio.Group>

      {unavailableMethods.length > 0 && (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Unavailable for {currency}:
          </Text>
          <Space wrap style={{ marginTop: 8 }}>
            {unavailableMethods.map((method) => (
              <Tag key={method.provider} color="default">
                {method.icon} {method.name}
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </Space>
  );
};

export default PaymentMethodSelector;
