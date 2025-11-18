import React from 'react';
import { Link } from 'react-router-dom';
import { Card as AntCard, Tag, Rate, Button } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Card } from '../../types';

const { Meta } = AntCard;

interface CardItemProps {
  card: Card;
  onAddToCart?: (card: Card) => void;
}

const CardItem: React.FC<CardItemProps> = ({ card, onAddToCart }) => {
  const discountedPrice = card.price * (1 - card.discount / 100);

  return (
    <AntCard
      hoverable
      className="card-item"
      cover={
        <div style={{ height: 200, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {card.imageUrl ? (
            <img alt={card.name} src={card.imageUrl} style={{ maxHeight: '100%', maxWidth: '100%' }} />
          ) : (
            <div style={{ fontSize: '48px', color: '#ccc' }}>💳</div>
          )}
        </div>
      }
      actions={[
        <Link to={`/cards/${card.id}`}>
          <Button type="link">View Details</Button>
        </Link>,
        onAddToCart && (
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={() => onAddToCart(card)}
          >
            Add to Cart
          </Button>
        ),
      ].filter(Boolean) as React.ReactNode[]}
    >
      <Meta
        title={
          <div>
            {card.name}
            {card.discount > 0 && (
              <Tag color="red" style={{ marginLeft: 8 }}>
                -{card.discount}%
              </Tag>
            )}
          </div>
        }
        description={
          <div>
            <div style={{ marginBottom: 8 }}>
              <span className="price-tag">${discountedPrice.toFixed(2)}</span>
              {card.discount > 0 && (
                <span className="original-price">${card.price.toFixed(2)}</span>
              )}
            </div>
            <div>
              <Tag>{card.category}</Tag>
              <Tag color="blue">Face Value: ${card.denomination}</Tag>
            </div>
            {card.supplier && (
              <div style={{ marginTop: 8 }}>
                <Rate disabled defaultValue={card.supplier.rating} style={{ fontSize: 14 }} />
                <span style={{ marginLeft: 8, color: '#888' }}>{card.supplier.name}</span>
              </div>
            )}
            <div style={{ marginTop: 8, color: card.stock > 0 ? 'green' : 'red' }}>
              {card.stock > 0 ? `${card.stock} in stock` : 'Out of stock'}
            </div>
          </div>
        }
      />
    </AntCard>
  );
};

export default CardItem;
