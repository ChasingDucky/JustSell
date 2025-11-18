import React from 'react';
import { Card, Row, Col, Skeleton, Space } from 'antd';

const StatsSkeleton: React.FC = () => {
  return (
    <div className="container">
      <Skeleton.Input active style={{ width: 200, marginBottom: 24 }} />

      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Space direction="vertical" size={24} style={{ width: '100%', marginTop: 24 }}>
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </Space>
    </div>
  );
};

export default StatsSkeleton;
