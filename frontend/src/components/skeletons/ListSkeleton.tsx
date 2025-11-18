import React from 'react';
import { Card, List, Skeleton, Space } from 'antd';

interface ListSkeletonProps {
  rows?: number;
  avatar?: boolean;
}

const ListSkeleton: React.FC<ListSkeletonProps> = ({ rows = 5, avatar = true }) => {
  return (
    <Card>
      <List
        itemLayout="horizontal"
        dataSource={Array.from({ length: rows })}
        renderItem={() => (
          <List.Item>
            <Skeleton avatar={avatar} active paragraph={{ rows: 2 }} />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default ListSkeleton;
