import React from 'react';
import { Card, Skeleton } from 'antd';

const CardSkeleton: React.FC = () => {
  return (
    <Card
      hoverable
      cover={<Skeleton.Image active style={{ width: '100%', height: 200 }} />}
    >
      <Skeleton active paragraph={{ rows: 2 }} />
    </Card>
  );
};

export default CardSkeleton;
