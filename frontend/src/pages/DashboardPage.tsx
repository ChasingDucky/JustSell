import React from 'react';
import { Card, Typography, Row, Col, Statistic } from 'antd';
import { ShoppingOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  return (
    <div className="container">
      <Title level={2}>Admin Dashboard</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Orders" value={0} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Revenue" value={0} prefix={<DollarOutlined />} prefix="$" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Users" value={0} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
