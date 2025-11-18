import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, Card, Typography, Button, Spin, Tag, Rate, InputNumber, Divider } from 'antd';
import { ShoppingCartOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { Card as CardType } from '../types';
import { addToCart } from '../store/slices/cartSlice';
import CardItem from '../components/cards/CardItem';

const { Title, Paragraph, Text } = Typography;

const CardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const [card, setCard] = useState<CardType | null>(null);
  const [similarCards, setSimilarCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      loadCard();
      loadSimilarCards();
    }
  }, [id]);

  const loadCard = async () => {
    try {
      setLoading(true);
      const response = await api.getCardById(id!);
      setCard(response.data);
    } catch (error) {
      console.error('Failed to load card:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSimilarCards = async () => {
    try {
      const response = await api.getSimilarCards(id!);
      setSimilarCards(response.data || []);
    } catch (error) {
      console.error('Failed to load similar cards:', error);
    }
  };

  const handleAddToCart = () => {
    if (card) {
      dispatch(
        addToCart({
          cardId: card.id,
          name: card.name,
          price: card.price * (1 - card.discount / 100),
          quantity,
          imageUrl: card.imageUrl,
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!card) {
    return <div>Card not found</div>;
  }

  const discountedPrice = card.price * (1 - card.discount / 100);

  return (
    <div className="container">
      <Link to="/search">
        <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 16 }}>
          Back to Search
        </Button>
      </Link>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card>
            <div style={{ height: 400, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {card.imageUrl ? (
                <img alt={card.name} src={card.imageUrl} style={{ maxHeight: '100%', maxWidth: '100%' }} />
              ) : (
                <div style={{ fontSize: '96px' }}>💳</div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card>
            <Title level={2}>{card.name}</Title>

            <div style={{ marginBottom: 16 }}>
              <Tag color="blue">{card.category}</Tag>
              {card.tags?.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>

            {card.supplier && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Supplier: </Text>
                <Text>{card.supplier.name}</Text>
                <Rate disabled defaultValue={card.supplier.rating} style={{ marginLeft: 16, fontSize: 14 }} />
              </div>
            )}

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <span className="price-tag">${discountedPrice.toFixed(2)}</span>
              {card.discount > 0 && (
                <>
                  <span className="original-price">${card.price.toFixed(2)}</span>
                  <span className="discount-badge">-{card.discount}%</span>
                </>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Face Value: </Text>
              <Text>${card.denomination.toFixed(2)}</Text>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Stock: </Text>
              <Text style={{ color: card.stock > 0 ? 'green' : 'red' }}>
                {card.stock > 0 ? `${card.stock} available` : 'Out of stock'}
              </Text>
            </div>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ marginRight: 16 }}>Quantity:</Text>
              <InputNumber
                min={1}
                max={card.stock || 1}
                value={quantity}
                onChange={(value) => setQuantity(value || 1)}
              />
            </div>

            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={handleAddToCart}
              disabled={card.stock === 0}
              block
            >
              Add to Cart
            </Button>

            <Divider />

            <div>
              <Title level={4}>Description</Title>
              <Paragraph>{card.description || 'No description available.'}</Paragraph>
            </div>
          </Card>
        </Col>
      </Row>

      {similarCards.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <Title level={3}>Similar Cards</Title>
          <Row gutter={[16, 16]}>
            {similarCards.map((similarCard) => (
              <Col key={similarCard.id} xs={24} sm={12} md={8} lg={6}>
                <CardItem card={similarCard} />
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export default CardDetailPage;
