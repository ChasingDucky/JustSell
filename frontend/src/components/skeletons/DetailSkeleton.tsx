import React from 'react';
import { Card, Skeleton, Row, Col, Space, Divider } from 'antd';

const DetailSkeleton: React.FC = () => {
  return (
    <div className="container">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card>
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              <Skeleton.Image active style={{ width: '100%', height: 400 }} />
              <Skeleton active paragraph={{ rows: 1 }} />
              <Divider />
              <Skeleton active paragraph={{ rows: 4 }} />
              <Divider />
              <Skeleton active paragraph={{ rows: 3 }} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Skeleton active paragraph={{ rows: 2 }} />
              <Divider />
              <Skeleton.Button active block size="large" />
              <Skeleton.Button active block size="large" />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DetailSkeleton;
