import React, { useEffect, useState } from 'react';
import { List, Card, Space, Typography, Tag, Button, Skeleton, Empty, Progress, Row, Col, Divider } from 'antd';
import { LikeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import RatingStars from './RatingStars';
import api from '../../services/api';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewListProps {
  cardId: string;
}

const ReviewList: React.FC<ReviewListProps> = ({ cardId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [cardId, page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await api.getCardReviews(cardId, page, pageSize);
      if (response.success) {
        setReviews(response.data.reviews);
        setTotal(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.getCardReviewStats(cardId);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load review stats:', error);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await api.markReviewHelpful(reviewId);
      loadReviews();
    } catch (error) {
      console.error('Failed to mark review as helpful:', error);
    }
  };

  const getRatingPercentage = (rating: number) => {
    if (!stats || stats.totalReviews === 0) return 0;
    return (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100;
  };

  if (loading && reviews.length === 0) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* Rating Summary */}
      {stats && stats.totalReviews > 0 && (
        <Card title="Customer Reviews">
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Title level={1} style={{ margin: 0, fontSize: 48 }}>
                  {stats.averageRating.toFixed(1)}
                </Title>
                <RatingStars value={stats.averageRating} disabled showValue={false} />
                <Text type="secondary">{stats.totalReviews} reviews</Text>
              </Space>
            </Col>
            <Col xs={24} md={16}>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <Row key={rating} align="middle" gutter={8}>
                    <Col span={4}>
                      <Text>{rating} star</Text>
                    </Col>
                    <Col span={16}>
                      <Progress
                        percent={getRatingPercentage(rating)}
                        size="small"
                        showInfo={false}
                        strokeColor="#faad14"
                      />
                    </Col>
                    <Col span={4}>
                      <Text type="secondary">
                        {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                      </Text>
                    </Col>
                  </Row>
                ))}
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Reviews List */}
      <Card title={`Reviews (${total})`}>
        {reviews.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={reviews}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (newPage) => setPage(newPage),
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} reviews`,
            }}
            renderItem={(review) => (
              <List.Item
                key={review.id}
                actions={[
                  <Button
                    type="text"
                    icon={<LikeOutlined />}
                    onClick={() => handleMarkHelpful(review.id)}
                  >
                    Helpful ({review.helpfulCount})
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space direction="vertical" size={4}>
                      <Space>
                        <RatingStars value={review.rating} disabled allowHalf={false} />
                        <Text strong>{review.title}</Text>
                      </Space>
                      {review.isVerifiedPurchase && (
                        <Tag icon={<CheckCircleOutlined />} color="success">
                          Verified Purchase
                        </Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text>
                        By {review.user.firstName} {review.user.lastName}
                      </Text>
                      <Text type="secondary">
                        {dayjs(review.createdAt).fromNow()}
                      </Text>
                    </Space>
                  }
                />
                <Paragraph style={{ marginTop: 12 }}>{review.comment}</Paragraph>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No reviews yet. Be the first to review this card!" />
        )}
      </Card>
    </Space>
  );
};

export default ReviewList;
