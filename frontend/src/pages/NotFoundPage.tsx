import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Result, Button, Space } from 'antd';
import { HomeOutlined, LeftOutlined } from '@ant-design/icons';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Space>
            <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/')}>
              Back Home
            </Button>
            <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </Space>
        }
      />
    </div>
  );
};

export default NotFoundPage;
