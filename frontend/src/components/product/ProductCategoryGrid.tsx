import React from 'react';
import { Card, Row, Col, Typography, Badge, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  count?: number;
  color?: string;
}

// Comprehensive virtual product categories
export const VIRTUAL_PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'game_card',
    name: 'Game Cards',
    icon: '🎮',
    description: 'Gift cards for gaming platforms',
    color: '#1890ff',
  },
  {
    id: 'game_account',
    name: 'Game Accounts',
    icon: '👤',
    description: 'Pre-leveled game accounts',
    color: '#722ed1',
  },
  {
    id: 'software_license',
    name: 'Software Licenses',
    icon: '💻',
    description: 'License keys for software',
    color: '#13c2c2',
  },
  {
    id: 'vpn_service',
    name: 'VPN Services',
    icon: '🔒',
    description: 'Virtual Private Networks',
    color: '#52c41a',
  },
  {
    id: 'streaming_subscription',
    name: 'Streaming',
    icon: '📺',
    description: 'Netflix, Disney+, HBO Max',
    color: '#eb2f96',
  },
  {
    id: 'music_subscription',
    name: 'Music Streaming',
    icon: '🎵',
    description: 'Spotify, Apple Music',
    color: '#fa8c16',
  },
  {
    id: 'mobile_recharge',
    name: 'Mobile Recharge',
    icon: '📱',
    description: 'Top-up your phone',
    color: '#faad14',
  },
  {
    id: 'gift_card',
    name: 'Gift Cards',
    icon: '🎁',
    description: 'Amazon, iTunes, Google Play',
    color: '#f5222d',
  },
  {
    id: 'cloud_storage',
    name: 'Cloud Storage',
    icon: '☁️',
    description: 'Dropbox, Google Drive, iCloud',
    color: '#2f54eb',
  },
  {
    id: 'web_hosting',
    name: 'Web Hosting',
    icon: '🌐',
    description: 'Domain & hosting services',
    color: '#1890ff',
  },
  {
    id: 'nft',
    name: 'NFTs',
    icon: '🖼️',
    description: 'Digital collectibles',
    color: '#722ed1',
  },
  {
    id: 'crypto_voucher',
    name: 'Crypto Vouchers',
    icon: '₿',
    description: 'Cryptocurrency gift cards',
    color: '#fa8c16',
  },
  {
    id: 'online_course',
    name: 'Online Courses',
    icon: '📚',
    description: 'Udemy, Coursera, edX',
    color: '#13c2c2',
  },
  {
    id: 'ebook',
    name: 'E-Books',
    icon: '📖',
    description: 'Digital books',
    color: '#52c41a',
  },
  {
    id: 'antivirus',
    name: 'Antivirus',
    icon: '🛡️',
    description: 'Security software',
    color: '#f5222d',
  },
  {
    id: 'proxy_service',
    name: 'Proxy Services',
    icon: '🔐',
    description: 'Residential & datacenter proxies',
    color: '#722ed1',
  },
];

interface ProductCategoryGridProps {
  onCategoryClick?: (categoryId: string) => void;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
}

const ProductCategoryGrid: React.FC<ProductCategoryGridProps> = ({
  onCategoryClick,
  columns = { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
}) => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryClick) {
      onCategoryClick(categoryId);
    } else {
      navigate(`/search?category=${categoryId}`);
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Browse by Category
      </Title>
      <Row gutter={[16, 16]}>
        {VIRTUAL_PRODUCT_CATEGORIES.map((category) => (
          <Col
            key={category.id}
            xs={24 / (columns.xs || 2)}
            sm={24 / (columns.sm || 3)}
            md={24 / (columns.md || 4)}
            lg={24 / (columns.lg || 6)}
            xl={24 / (columns.xl || 8)}
          >
            <Card
              hoverable
              onClick={() => handleCategoryClick(category.id)}
              style={{
                textAlign: 'center',
                height: '100%',
                borderColor: category.color,
                transition: 'all 0.3s',
              }}
              bodyStyle={{ padding: '16px 8px' }}
              className="category-card"
            >
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div style={{ fontSize: 40 }}>{category.icon}</div>
                <Text strong style={{ fontSize: 14, color: category.color }}>
                  {category.name}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {category.description}
                </Text>
                {category.count !== undefined && (
                  <Badge
                    count={category.count}
                    style={{
                      backgroundColor: category.color,
                    }}
                  />
                )}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <style>{`
        .category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
};

export default ProductCategoryGrid;
