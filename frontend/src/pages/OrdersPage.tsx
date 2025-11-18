import React from 'react';
import { Card, Typography, Empty } from 'antd';

const { Title } = Typography;

const OrdersPage: React.FC = () => {
  return (
    <div className="container">
      <Card>
        <Title level={2}>My Orders</Title>
        <Empty description="No orders yet" />
      </Card>
    </div>
  );
};

export default OrdersPage;
