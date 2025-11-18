import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const CheckoutPage: React.FC = () => {
  return (
    <div className="container">
      <Card>
        <Title level={2}>Checkout</Title>
      </Card>
    </div>
  );
};

export default CheckoutPage;
