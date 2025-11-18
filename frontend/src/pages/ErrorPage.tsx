import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Result, Button, Typography, Space } from 'antd';
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface ErrorPageProps {
  error?: Error;
  resetError?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ error, resetError }) => {
  const navigate = useNavigate();

  const handleReload = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Result
        status="500"
        title="Oops! Something went wrong"
        subTitle="We're sorry for the inconvenience. Please try again later."
        extra={
          <Space direction="vertical" size={16}>
            {error && (
              <Paragraph>
                <Text type="danger" code>
                  {error.message}
                </Text>
              </Paragraph>
            )}
            <Space>
              <Button type="primary" icon={<ReloadOutlined />} onClick={handleReload}>
                Try Again
              </Button>
              <Button icon={<HomeOutlined />} onClick={() => navigate('/')}>
                Back Home
              </Button>
            </Space>
          </Space>
        }
      />
    </div>
  );
};

export default ErrorPage;
