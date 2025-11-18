import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Pagination,
  Empty,
  Spin,
  Image,
  Rate,
  Select,
  Input,
  message,
} from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  EyeOutlined,
  ShoppingCartOutlined,
  CrownOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ProductFeatureBadges from '../product/ProductFeatureBadges';
import { VIRTUAL_PRODUCT_CATEGORIES } from '../product/ProductCategoryGrid';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

interface ListingGridProps {
  category?: string;
  sellerId?: string;
  showFilters?: boolean;
}

const ListingGrid: React.FC<ListingGridProps> = ({
  category,
  sellerId,
  showFilters = true,
}) => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    category: category || '',
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    sortBy: 'recent',
    sortOrder: 'DESC',
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadListings();
  }, [page, filters, category, sellerId]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const params: any = {
        ...filters,
        category: category || filters.category,
        page,
        limit: 12,
      };

      const response = await api.searchListings(params);

      if (response.success) {
        setListings(response.data);
        setTotal(response.pagination.total);
      }
    } catch (error) {
      message.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setFilters({ ...filters, category: value });
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    setFilters({ ...filters, sortBy, sortOrder });
    setPage(1);
  };

  const formatPrice = (price: number, currency: string) => {
    const symbols: any = { USD: '$', EUR: '€', GBP: '£', CNY: '¥' };
    return `${symbols[currency] || currency} ${price.toFixed(2)}`;
  };

  const getCategoryInfo = (categoryId: string) => {
    return VIRTUAL_PRODUCT_CATEGORIES.find(c => c.id === categoryId);
  };

  return (
    <div>
      {showFilters && (
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Search
                placeholder="Search products..."
                onSearch={handleSearch}
                size="large"
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Category"
                size="large"
                style={{ width: '100%' }}
                allowClear
                onChange={handleCategoryChange}
                value={filters.category || undefined}
              >
                {VIRTUAL_PRODUCT_CATEGORIES.map((cat) => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Sort by"
                size="large"
                style={{ width: '100%' }}
                defaultValue="recent-DESC"
                onChange={handleSortChange}
              >
                <Option value="recent-DESC">Newest First</Option>
                <Option value="price-ASC">Price: Low to High</Option>
                <Option value="price-DESC">Price: High to Low</Option>
                <Option value="rating-DESC">Highest Rated</Option>
                <Option value="sales-DESC">Most Popular</Option>
              </Select>
            </Col>
          </Row>
        </Card>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
        </div>
      ) : listings.length === 0 ? (
        <Empty description="No listings found" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {listings.map((listing) => {
              const categoryInfo = getCategoryInfo(listing.category);
              const hasDiscount = listing.originalPrice && listing.originalPrice > listing.price;
              const discountPercent = hasDiscount
                ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
                : 0;

              return (
                <Col key={listing.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    hoverable
                    cover={
                      listing.images && listing.images.length > 0 ? (
                        <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                          <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            style={{ width: '100%', height: 200, objectFit: 'cover' }}
                            preview={false}
                          />
                          {hasDiscount && (
                            <Tag
                              color="red"
                              style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                fontSize: 14,
                                fontWeight: 'bold',
                              }}
                            >
                              -{discountPercent}%
                            </Tag>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 200,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f0f0f0',
                            fontSize: 48,
                          }}
                        >
                          {categoryInfo?.icon || '📦'}
                        </div>
                      )
                    }
                    onClick={() => navigate(`/marketplace/${listing.id}`)}
                  >
                    <Card.Meta
                      title={
                        <div style={{ height: 44, overflow: 'hidden' }}>
                          <Text strong ellipsis={{ tooltip: listing.title }}>
                            {listing.title}
                          </Text>
                        </div>
                      }
                      description={
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          <div>
                            <Space>
                              <Rate disabled defaultValue={listing.rating} style={{ fontSize: 12 }} />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                ({listing.totalReviews})
                              </Text>
                            </Space>
                          </div>

                          <ProductFeatureBadges features={listing.features} maxTags={2} />

                          <div>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <div>
                                <Text
                                  strong
                                  style={{
                                    fontSize: 20,
                                    color: '#cf1322',
                                  }}
                                >
                                  {formatPrice(listing.price, listing.currency)}
                                </Text>
                                {hasDiscount && (
                                  <Text
                                    delete
                                    type="secondary"
                                    style={{ marginLeft: 8, fontSize: 14 }}
                                  >
                                    {formatPrice(listing.originalPrice, listing.currency)}
                                  </Text>
                                )}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Space size={4}>
                                  {listing.seller?.verified && (
                                    <Tag color="blue" icon={<SafetyOutlined />}>
                                      Verified
                                    </Tag>
                                  )}
                                  {listing.seller?.level === 'diamond' && (
                                    <Tag color="cyan" icon={<CrownOutlined />}>
                                      Diamond
                                    </Tag>
                                  )}
                                </Space>
                                <Space size={4} style={{ fontSize: 12, color: '#999' }}>
                                  <EyeOutlined />
                                  <Text type="secondary">{listing.views}</Text>
                                </Space>
                              </div>
                            </Space>
                          </div>
                        </Space>
                      }
                    />
                  </Card>
                </Col>
              );
            })}
          </Row>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Pagination
              current={page}
              total={total}
              pageSize={12}
              onChange={setPage}
              showSizeChanger={false}
              showTotal={(total) => `Total ${total} items`}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ListingGrid;
