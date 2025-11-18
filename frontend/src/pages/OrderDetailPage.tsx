import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const OrderDetailPage: React.FC = () => {
  return (
    <div className="container">
      <Card>
        <Title level={2}>Order Details</Title>
      </Card>
    </div>
  );
};

export default OrderDetailPage;
