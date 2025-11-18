import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Row, Col, Card, Select, Slider, Input, Button, Spin, Pagination, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import CardItem from '../components/cards/CardItem';
import api from '../services/api';
import { Card as CardType } from '../types';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';

const { Option } = Select;

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    searchCards();
  }, [page, keyword, category, priceRange]);

  const loadCategories = async () => {
    try {
      const response = await api.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const searchCards = async () => {
    try {
      setLoading(true);
      const response = await api.search({
        keyword,
        category: category || undefined,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        page,
        limit,
      });

      setCards(response.data?.results || []);
      setTotal(response.data?.pagination?.total || 0);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    searchCards();
    setSearchParams({ keyword, category });
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

  return (
    <div className="container">
      <Row gutter={[24, 24]}>
        {/* Filters Sidebar */}
        <Col xs={24} md={6}>
          <Card title="Filters" className="filter-panel">
            <div style={{ marginBottom: 16 }}>
              <label>Search</label>
              <Input
                placeholder="Search cards..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Category</label>
              <Select
                style={{ width: '100%' }}
                placeholder="All Categories"
                value={category || undefined}
                onChange={setCategory}
                allowClear
              >
                {categories.map((cat) => (
                  <Option key={cat} value={cat}>
                    {cat}
                  </Option>
                ))}
              </Select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>Price Range: ${priceRange[0]} - ${priceRange[1]}</label>
              <Slider
                range
                min={0}
                max={200}
                value={priceRange}
                onChange={(value) => setPriceRange(value as [number, number])}
              />
            </div>

            <Button type="primary" block onClick={handleSearch}>
              Apply Filters
            </Button>
          </Card>
        </Col>

        {/* Results */}
        <Col xs={24} md={18}>
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Search Results ({total})</h2>
            </div>

            {loading ? (
              <div className="loading-container">
                <Spin size="large" />
              </div>
            ) : cards.length > 0 ? (
              <>
                <Row gutter={[16, 16]}>
                  {cards.map((card) => (
                    <Col key={card.id} xs={24} sm={12} lg={8}>
                      <CardItem card={card} onAddToCart={handleAddToCart} />
                    </Col>
                  ))}
                </Row>

                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <Pagination
                    current={page}
                    total={total}
                    pageSize={limit}
                    onChange={setPage}
                    showSizeChanger={false}
                  />
                </div>
              </>
            ) : (
              <Empty description="No cards found" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SearchPage;
