import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Typography, Carousel, Card, Button, Spin } from 'antd';
import { SearchOutlined, FireOutlined, ThunderboltOutlined } from '@ant-design/icons';
import CardItem from '../components/cards/CardItem';
import api from '../services/api';
import { Card as CardType } from '../types';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const dispatch = useDispatch();
  const [popularCards, setPopularCards] = useState<CardType[]>([]);
  const [bestDeals, setBestDeals] = useState<CardType[]>([]);
  const [trending, setTrending] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [popularRes, dealsRes, trendingRes] = await Promise.all([
        api.getPopularCards(8),
        api.getBestDeals(8),
        api.getTrendingCards(8),
      ]);

      setPopularCards(popularRes.data || []);
      setBestDeals(dealsRes.data || []);
      setTrending(trendingRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (card: CardType) => {
    dispatch(
      addToCart({
        cardId: card.id,
        name: card.name,
        price: card.price * (1 - card.discount / 100),
        quantity: 1,
        imageUrl: card.imageUrl,
      })
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="container">
      {/* Hero Section */}
      <Carousel autoplay style={{ marginBottom: 40 }}>
        <div>
          <div
            style={{
              height: 400,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              borderRadius: 8,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <Title level={1} style={{ color: '#fff' }}>
                Welcome to CardSky
              </Title>
              <Paragraph style={{ fontSize: 20, color: '#fff' }}>
                Find the best deals on digital cards from trusted suppliers
              </Paragraph>
              <Link to="/search">
                <Button type="primary" size="large" icon={<SearchOutlined />}>
                  Browse Cards
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div>
          <div
            style={{
              height: 400,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              borderRadius: 8,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <Title level={1} style={{ color: '#fff' }}>
                Best Prices Guaranteed
              </Title>
              <Paragraph style={{ fontSize: 20, color: '#fff' }}>
                Compare prices across multiple suppliers instantly
              </Paragraph>
            </div>
          </div>
        </div>
      </Carousel>

      {/* Best Deals Section */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <ThunderboltOutlined style={{ fontSize: 32, color: '#f5222d', marginRight: 10 }} />
          <Title level={2} style={{ margin: 0 }}>
            Best Deals
          </Title>
        </div>
        <Row gutter={[16, 16]}>
          {bestDeals.map((card) => (
            <Col key={card.id} xs={24} sm={12} md={8} lg={6}>
              <CardItem card={card} onAddToCart={handleAddToCart} />
            </Col>
          ))}
        </Row>
      </section>

      {/* Trending Cards Section */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <FireOutlined style={{ fontSize: 32, color: '#fa8c16', marginRight: 10 }} />
          <Title level={2} style={{ margin: 0 }}>
            Trending Now
          </Title>
        </div>
        <Row gutter={[16, 16]}>
          {trending.map((card) => (
            <Col key={card.id} xs={24} sm={12} md={8} lg={6}>
              <CardItem card={card} onAddToCart={handleAddToCart} />
            </Col>
          ))}
        </Row>
      </section>

      {/* Popular Cards Section */}
      <section style={{ marginBottom: 40 }}>
        <Title level={2} style={{ marginBottom: 20 }}>
          Popular Cards
        </Title>
        <Row gutter={[16, 16]}>
          {popularCards.map((card) => (
            <Col key={card.id} xs={24} sm={12} md={8} lg={6}>
              <CardItem card={card} onAddToCart={handleAddToCart} />
            </Col>
          ))}
        </Row>
      </section>

      {/* Features Section */}
      <section style={{ marginTop: 60, marginBottom: 40 }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>
          Why Choose CardSky?
        </Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <Title level={4}>Secure & Safe</Title>
              <Paragraph>All transactions are encrypted and secure</Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
              <Title level={4}>Instant Delivery</Title>
              <Paragraph>Get your cards immediately after purchase</Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
              <Title level={4}>Best Prices</Title>
              <Paragraph>Compare prices from multiple suppliers</Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌟</div>
              <Title level={4}>Trusted Suppliers</Title>
              <Paragraph>All suppliers are verified and rated</Paragraph>
            </Card>
          </Col>
        </Row>
      </section>
    </div>
  );
};

export default HomePage;
