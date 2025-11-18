import React from 'react';
import { Card, Typography, Empty } from 'antd';

const { Title } = Typography;

const CartPage: React.FC = () => {
  return (
    <div className="container">
      <Card>
        <Title level={2}>Shopping Cart</Title>
        <Empty description="Your cart is empty" />
      </Card>
    </div>
  );
};

export default CartPage;
