import React from 'react';
import { Tag, Space, Tooltip } from 'antd';
import {
  ThunderboltOutlined,
  SafetyOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  LockOutlined,
} from '@ant-design/icons';

interface ProductFeature {
  key: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  tooltip?: string;
}

const PRODUCT_FEATURES: Record<string, ProductFeature> = {
  instant_delivery: {
    key: 'instant_delivery',
    label: 'Instant Delivery',
    icon: <ThunderboltOutlined />,
    color: 'gold',
    tooltip: 'Delivered instantly after payment confirmation',
  },
  auto_renewal: {
    key: 'auto_renewal',
    label: 'Auto-Renewal',
    icon: <ReloadOutlined />,
    color: 'blue',
    tooltip: 'Automatically renews before expiration',
  },
  refundable: {
    key: 'refundable',
    label: 'Refundable',
    icon: <SafetyOutlined />,
    color: 'green',
    tooltip: 'Full refund available within 24 hours',
  },
  global: {
    key: 'global',
    label: 'Global',
    icon: <GlobalOutlined />,
    color: 'cyan',
    tooltip: 'Works worldwide',
  },
  regional: {
    key: 'regional',
    label: 'Regional',
    icon: <GlobalOutlined />,
    color: 'orange',
    tooltip: 'Region-specific product',
  },
  lifetime: {
    key: 'lifetime',
    label: 'Lifetime',
    icon: <CrownOutlined />,
    color: 'purple',
    tooltip: 'Lifetime access with no expiration',
  },
  limited_time: {
    key: 'limited_time',
    label: 'Limited Time',
    icon: <ClockCircleOutlined />,
    color: 'red',
    tooltip: 'Time-limited offer',
  },
  verified: {
    key: 'verified',
    label: 'Verified',
    icon: <CheckCircleOutlined />,
    color: 'green',
    tooltip: 'Verified by platform',
  },
  secure: {
    key: 'secure',
    label: 'Secure',
    icon: <LockOutlined />,
    color: 'blue',
    tooltip: 'Encrypted and secure delivery',
  },
  premium: {
    key: 'premium',
    label: 'Premium',
    icon: <CrownOutlined />,
    color: 'gold',
    tooltip: 'Premium quality product',
  },
};

interface ProductFeatureBadgesProps {
  features: string[];
  size?: 'small' | 'default';
  maxTags?: number;
}

const ProductFeatureBadges: React.FC<ProductFeatureBadgesProps> = ({
  features,
  size = 'default',
  maxTags,
}) => {
  const displayFeatures = maxTags ? features.slice(0, maxTags) : features;
  const remainingCount = maxTags && features.length > maxTags ? features.length - maxTags : 0;

  return (
    <Space wrap size={4}>
      {displayFeatures.map((featureKey) => {
        const feature = PRODUCT_FEATURES[featureKey];
        if (!feature) return null;

        const tag = (
          <Tag
            key={feature.key}
            color={feature.color}
            icon={feature.icon}
            style={{ margin: 2 }}
          >
            {feature.label}
          </Tag>
        );

        return feature.tooltip ? (
          <Tooltip key={feature.key} title={feature.tooltip}>
            {tag}
          </Tooltip>
        ) : (
          tag
        );
      })}
      {remainingCount > 0 && (
        <Tag style={{ margin: 2 }}>+{remainingCount} more</Tag>
      )}
    </Space>
  );
};

export default ProductFeatureBadges;
export { PRODUCT_FEATURES };
