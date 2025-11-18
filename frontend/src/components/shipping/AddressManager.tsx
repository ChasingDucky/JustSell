import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  message,
  Popconfirm,
  Row,
  Col,
  Typography,
  Empty,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

interface Address {
  id: string;
  name: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  address: string;
  address2?: string;
  postalCode: string;
  isDefault: boolean;
  addressType: 'residential' | 'commercial';
}

interface AddressManagerProps {
  onSelectAddress?: (address: Address) => void;
  selectionMode?: boolean;
  selectedAddressId?: string;
}

const AddressManager: React.FC<AddressManagerProps> = ({
  onSelectAddress,
  selectionMode = false,
  selectedAddressId,
}) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.getUserAddresses();
      if (response.success) {
        setAddresses(response.data);
      }
    } catch (error) {
      message.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    form.setFieldsValue(address);
    setModalVisible(true);
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const response = await api.deleteAddress(id);
      if (response.success) {
        message.success('Address deleted successfully');
        loadAddresses();
      }
    } catch (error) {
      message.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await api.setDefaultAddress(id);
      if (response.success) {
        message.success('Default address updated');
        loadAddresses();
      }
    } catch (error) {
      message.error('Failed to set default address');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      let response;
      if (editingAddress) {
        response = await api.updateAddress(editingAddress.id, values);
      } else {
        response = await api.createAddress(values);
      }

      if (response.success) {
        message.success(
          editingAddress
            ? 'Address updated successfully'
            : 'Address created successfully'
        );
        setModalVisible(false);
        loadAddresses();
      }
    } catch (error) {
      message.error('Failed to save address');
    }
  };

  const renderAddressCard = (address: Address) => (
    <List.Item
      key={address.id}
      style={{
        cursor: selectionMode ? 'pointer' : 'default',
        backgroundColor:
          selectionMode && selectedAddressId === address.id
            ? '#e6f7ff'
            : 'transparent',
        padding: '16px',
        border:
          selectionMode && selectedAddressId === address.id
            ? '2px solid #1890ff'
            : '1px solid #f0f0f0',
        borderRadius: '8px',
        marginBottom: '12px',
      }}
      onClick={() => {
        if (selectionMode && onSelectAddress) {
          onSelectAddress(address);
        }
      }}
    >
      <div style={{ width: '100%' }}>
        <Row justify="space-between" align="top">
          <Col span={18}>
            <Space direction="vertical" size={4}>
              <Space>
                <Text strong style={{ fontSize: 16 }}>
                  {address.name}
                </Text>
                {address.isDefault && (
                  <Tag color="blue" icon={<CheckCircleOutlined />}>
                    Default
                  </Tag>
                )}
                <Tag
                  icon={
                    address.addressType === 'residential' ? (
                      <HomeOutlined />
                    ) : (
                      <ShopOutlined />
                    )
                  }
                >
                  {address.addressType === 'residential'
                    ? 'Residential'
                    : 'Commercial'}
                </Tag>
              </Space>
              <Text>{address.phone}</Text>
              <Text type="secondary">
                {address.address}
                {address.address2 && `, ${address.address2}`}
              </Text>
              <Text type="secondary">
                {address.city}, {address.state} {address.postalCode}
              </Text>
              <Text type="secondary">{address.country}</Text>
            </Space>
          </Col>
          {!selectionMode && (
            <Col>
              <Space>
                {!address.isDefault && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    Set as default
                  </Button>
                )}
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEditAddress(address)}
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Delete this address?"
                  onConfirm={() => handleDeleteAddress(address.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            </Col>
          )}
        </Row>
      </div>
    </List.Item>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              {selectionMode ? 'Select Shipping Address' : 'Shipping Addresses'}
            </Title>
          </Space>
        }
        extra={
          !selectionMode && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddAddress}
            >
              Add Address
            </Button>
          )
        }
      >
        {addresses.length === 0 ? (
          <Empty
            description="No addresses found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {!selectionMode && (
              <Button type="primary" onClick={handleAddAddress}>
                Add Your First Address
              </Button>
            )}
          </Empty>
        ) : (
          <List
            dataSource={addresses}
            renderItem={renderAddressCard}
            style={{ border: 'none' }}
          />
        )}
      </Card>

      <Modal
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ addressType: 'residential', isDefault: false }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter name' }]}
              >
                <Input placeholder="John Doe" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: 'Please enter phone number' },
                ]}
              >
                <Input placeholder="+1 234 567 8900" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address Line 1"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <Input placeholder="Street address" />
          </Form.Item>

          <Form.Item name="address2" label="Address Line 2">
            <Input placeholder="Apartment, suite, etc. (optional)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="City" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="state"
                label="State/Province"
                rules={[{ required: true, message: 'Please enter state' }]}
              >
                <Input placeholder="State" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="postalCode"
                label="Postal Code"
                rules={[
                  { required: true, message: 'Please enter postal code' },
                ]}
              >
                <Input placeholder="12345" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="country"
            label="Country"
            rules={[{ required: true, message: 'Please select country' }]}
          >
            <Select placeholder="Select country">
              <Option value="US">United States</Option>
              <Option value="CN">China</Option>
              <Option value="GB">United Kingdom</Option>
              <Option value="CA">Canada</Option>
              <Option value="AU">Australia</Option>
              <Option value="DE">Germany</Option>
              <Option value="FR">France</Option>
              <Option value="JP">Japan</Option>
              <Option value="KR">South Korea</Option>
              <Option value="SG">Singapore</Option>
            </Select>
          </Form.Item>

          <Form.Item name="addressType" label="Address Type">
            <Select>
              <Option value="residential">Residential</Option>
              <Option value="commercial">Commercial</Option>
            </Select>
          </Form.Item>

          <Form.Item name="isDefault" valuePropName="checked">
            <Space>
              <input type="checkbox" />
              <Text>Set as default address</Text>
            </Space>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingAddress ? 'Update' : 'Add'} Address
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddressManager;
