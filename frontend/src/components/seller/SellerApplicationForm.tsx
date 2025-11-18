import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Upload,
  message,
  Typography,
  Space,
  Alert,
} from 'antd';
import { UploadOutlined, ShopOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const SellerApplicationForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const response = await api.applyAsSeller({
        storeName: values.storeName,
        description: values.description,
        logo: values.logo?.file?.response?.url,
        businessLicense: values.businessLicense?.file?.response?.url,
        idVerification: values.idVerification?.file?.response?.url,
      });

      if (response.success) {
        message.success('Seller application submitted successfully!');
        navigate('/seller/dashboard');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <ShopOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={2}>Become a Seller</Title>
            <Paragraph type="secondary">
              Start selling your virtual products on our platform. Join thousands of successful sellers.
            </Paragraph>
          </div>

          <Alert
            message="Seller Benefits"
            description={
              <ul>
                <li>Reach millions of potential customers</li>
                <li>Secure escrow payment protection</li>
                <li>Low platform fees (5%)</li>
                <li>Professional seller dashboard and analytics</li>
                <li>24/7 support and dispute resolution</li>
              </ul>
            }
            type="info"
            showIcon
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{}}
          >
            <Form.Item
              label="Store Name"
              name="storeName"
              rules={[
                { required: true, message: 'Please enter your store name' },
                { min: 3, message: 'Store name must be at least 3 characters' },
                { max: 50, message: 'Store name must be less than 50 characters' },
              ]}
            >
              <Input
                placeholder="Enter a unique store name"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Store Description"
              name="description"
              rules={[
                { required: true, message: 'Please enter a description' },
                { min: 50, message: 'Description must be at least 50 characters' },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Describe what you sell and what makes your store unique..."
              />
            </Form.Item>

            <Form.Item
              label="Store Logo (Optional)"
              name="logo"
            >
              <Upload
                maxCount={1}
                listType="picture"
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Upload Logo</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              label="Business License (Optional)"
              name="businessLicense"
              extra="If you have a registered business, upload your license for verification"
            >
              <Upload
                maxCount={1}
                accept="image/*,application/pdf"
              >
                <Button icon={<UploadOutlined />}>Upload License</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              label="ID Verification (Optional)"
              name="idVerification"
              extra="Upload your ID for account verification (recommended for faster approval)"
            >
              <Upload
                maxCount={1}
                accept="image/*,application/pdf"
              >
                <Button icon={<UploadOutlined />}>Upload ID</Button>
              </Upload>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                Submit Application
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default SellerApplicationForm;
