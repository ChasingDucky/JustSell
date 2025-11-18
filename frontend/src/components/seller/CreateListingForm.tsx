import React, { useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Upload,
  Space,
  Row,
  Col,
  Typography,
  message,
  Switch,
  Tag,
} from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { VIRTUAL_PRODUCT_CATEGORIES } from '../product/ProductCategoryGrid';
import { PRODUCT_FEATURES } from '../product/ProductFeatureBadges';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const deliveryTypes = [
  { value: 'code', label: 'Activation Code / Key' },
  { value: 'account', label: 'Account Credentials' },
  { value: 'file', label: 'Digital File Download' },
  { value: 'api', label: 'API Access' },
  { value: 'link', label: 'Email Link' },
  { value: 'qr', label: 'QR Code' },
  { value: 'blockchain', label: 'Blockchain Transaction' },
];

const listingTypes = [
  { value: 'single', label: 'Single Item (One-time sale)' },
  { value: 'multiple', label: 'Multiple Items (Limited stock)' },
  { value: 'unlimited', label: 'Unlimited Stock' },
];

const CreateListingForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      const listingData = {
        title: values.title,
        description: values.description,
        category: values.category,
        subcategory: values.subcategory,
        images: values.images?.fileList.map((file: any) => file.response?.url || file.url) || [],
        price: values.price,
        currency: values.currency,
        originalPrice: values.originalPrice,
        discountPercent: values.discountPercent,
        deliveryType: values.deliveryType,
        deliveryTime: values.deliveryTime,
        autoDelivery: values.autoDelivery,
        stock: values.stock || 0,
        listingType: values.listingType,
        features: selectedFeatures,
        tags: values.tags || [],
        termsAndConditions: values.termsAndConditions,
        refundPolicy: values.refundPolicy,
        metadata: {
          platform: values.platform,
          region: values.region,
          language: values.language,
        },
      };

      const response = await api.createListing(listingData);

      if (response.success) {
        message.success('Listing created successfully!');
        navigate('/seller/listings');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (featureKey: string) => {
    if (selectedFeatures.includes(featureKey)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== featureKey));
    } else {
      setSelectedFeatures([...selectedFeatures, featureKey]);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 16px' }}>
      <Title level={2}>Create New Listing</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          currency: 'USD',
          deliveryTime: 30,
          autoDelivery: false,
          listingType: 'multiple',
          tags: [],
        }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            {/* Basic Information */}
            <Card title="Basic Information" style={{ marginBottom: 24 }}>
              <Form.Item
                label="Product Title"
                name="title"
                rules={[
                  { required: true, message: 'Please enter product title' },
                  { min: 10, message: 'Title must be at least 10 characters' },
                ]}
              >
                <Input placeholder="Enter a descriptive title for your product" size="large" />
              </Form.Item>

              <Form.Item
                label="Description"
                name="description"
                rules={[
                  { required: true, message: 'Please enter product description' },
                  { min: 50, message: 'Description must be at least 50 characters' },
                ]}
              >
                <TextArea
                  rows={6}
                  placeholder="Describe your product in detail. Include features, benefits, and what makes it unique..."
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true, message: 'Please select a category' }]}
                  >
                    <Select placeholder="Select category" size="large">
                      {VIRTUAL_PRODUCT_CATEGORIES.map((cat) => (
                        <Option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Subcategory" name="subcategory">
                    <Input placeholder="e.g., Steam, PlayStation" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Product Images" name="images">
                <Upload
                  listType="picture-card"
                  multiple
                  maxCount={5}
                  accept="image/*"
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Card>

            {/* Pricing */}
            <Card title="Pricing" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Price"
                    name="price"
                    rules={[{ required: true, message: 'Please enter price' }]}
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      style={{ width: '100%' }}
                      addonAfter={
                        <Form.Item name="currency" noStyle>
                          <Select style={{ width: 80 }}>
                            <Option value="USD">USD</Option>
                            <Option value="EUR">EUR</Option>
                            <Option value="GBP">GBP</Option>
                            <Option value="CNY">CNY</Option>
                          </Select>
                        </Form.Item>
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Original Price (Optional)" name="originalPrice">
                    <InputNumber
                      min={0}
                      precision={2}
                      style={{ width: '100%' }}
                      placeholder="Show strikethrough price"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Delivery Settings */}
            <Card title="Delivery Settings" style={{ marginBottom: 24 }}>
              <Form.Item
                label="Delivery Type"
                name="deliveryType"
                rules={[{ required: true, message: 'Please select delivery type' }]}
              >
                <Select placeholder="How will customers receive this product?">
                  {deliveryTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Delivery Time (minutes)"
                    name="deliveryTime"
                    tooltip="Estimated time to deliver after payment"
                  >
                    <InputNumber min={1} max={1440} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Auto Delivery"
                    name="autoDelivery"
                    valuePropName="checked"
                    tooltip="Enable automatic delivery after payment confirmation"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Stock & Inventory */}
            <Card title="Stock & Inventory" style={{ marginBottom: 24 }}>
              <Form.Item
                label="Listing Type"
                name="listingType"
                rules={[{ required: true }]}
              >
                <Select>
                  {listingTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.listingType !== currentValues.listingType
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue('listingType') !== 'unlimited' ? (
                    <Form.Item
                      label="Initial Stock"
                      name="stock"
                      rules={[{ required: true, message: 'Please enter stock quantity' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Card>

            {/* Terms & Policies */}
            <Card title="Terms & Policies" style={{ marginBottom: 24 }}>
              <Form.Item label="Terms and Conditions" name="termsAndConditions">
                <TextArea rows={3} placeholder="Specify any terms customers should know..." />
              </Form.Item>

              <Form.Item label="Refund Policy" name="refundPolicy">
                <TextArea rows={2} placeholder="Describe your refund policy..." />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            {/* Product Features */}
            <Card title="Product Features" style={{ marginBottom: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(PRODUCT_FEATURES).map(([key, feature]) => (
                  <Tag
                    key={key}
                    color={selectedFeatures.includes(key) ? feature.color : 'default'}
                    style={{ cursor: 'pointer', marginBottom: 8 }}
                    onClick={() => handleFeatureToggle(key)}
                  >
                    {feature.icon} {feature.label}
                  </Tag>
                ))}
              </Space>
            </Card>

            {/* Additional Details */}
            <Card title="Additional Details" style={{ marginBottom: 24 }}>
              <Form.Item label="Platform" name="platform">
                <Select mode="tags" placeholder="e.g., PC, Mobile, Console" />
              </Form.Item>

              <Form.Item label="Region" name="region">
                <Select mode="tags" placeholder="e.g., Global, US, EU" />
              </Form.Item>

              <Form.Item label="Language" name="language">
                <Select mode="tags" placeholder="e.g., English, Spanish" />
              </Form.Item>

              <Form.Item label="Tags" name="tags">
                <Select
                  mode="tags"
                  placeholder="Add relevant tags"
                  tokenSeparators={[',']}
                />
              </Form.Item>
            </Card>

            {/* Submit */}
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Create Listing
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default CreateListingForm;
