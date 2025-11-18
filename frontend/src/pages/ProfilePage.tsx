import React from 'react';
import { Card, Typography, Descriptions, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const { Title } = Typography;

const ProfilePage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="container">
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <Avatar size={64} icon={<UserOutlined />} style={{ marginRight: 16 }} />
          <Title level={2} style={{ margin: 0 }}>
            {user?.firstName} {user?.lastName}
          </Title>
        </div>

        <Descriptions bordered column={1}>
          <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
          <Descriptions.Item label="First Name">{user?.firstName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Last Name">{user?.lastName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Phone">{user?.phone || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Role">
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {user?.status?.charAt(0).toUpperCase() + user?.status?.slice(1)}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default ProfilePage;
