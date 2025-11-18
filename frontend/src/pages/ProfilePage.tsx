import React, { useState } from 'react';
import { Card, Typography, Descriptions, Avatar, Button, Modal, Form, Input, message, Tabs } from 'antd';
import { UserOutlined, EditOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setUser } from '../store/slices/authSlice';
import api from '../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleEditProfile = async (values: any) => {
    try {
      setLoading(true);
      const response = await api.updateProfile(values);

      if (response.success) {
        // Update user in Redux store
        const updatedUser = { ...user, ...values };
        dispatch(setUser({ user: updatedUser, token: token! }));

        message.success('Profile updated successfully');
        setEditModalVisible(false);
        form.resetFields();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      setLoading(true);
      const response = await api.changePassword(values);

      if (response.success) {
        message.success('Password changed successfully');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    form.setFieldsValue({
      firstName: user?.firstName,
      lastName: user?.lastName,
      phone: user?.phone,
    });
    setEditModalVisible(true);
  };

  return (
    <div className="container">
      <Tabs defaultActiveKey="profile">
        <TabPane tab="Profile" key="profile">
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
              <Avatar size={64} icon={<UserOutlined />} style={{ marginRight: 16 }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {user?.firstName} {user?.lastName}
                </Title>
                <Text type="secondary">{user?.email}</Text>
              </div>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={openEditModal}
                style={{ marginLeft: 'auto' }}
              >
                Edit Profile
              </Button>
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
        </TabPane>

        <TabPane tab="Security" key="security">
          <Card>
            <Title level={3}>Security Settings</Title>

            <div style={{ marginTop: 24 }}>
              <Title level={4}>Password</Title>
              <Text type="secondary">Keep your account secure by using a strong password.</Text>
              <div style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  icon={<LockOutlined />}
                  onClick={() => setPasswordModalVisible(true)}
                >
                  Change Password
                </Button>
              </div>
            </div>

            <div style={{ marginTop: 32 }}>
              <Title level={4}>Two-Factor Authentication</Title>
              <Text type="secondary">Add an extra layer of security to your account.</Text>
              <div style={{ marginTop: 16 }}>
                <Button disabled>Enable 2FA (Coming Soon)</Button>
              </div>
            </div>
          </Card>
        </TabPane>
      </Tabs>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditProfile}
        >
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[{ required: true, message: 'Please enter your first name' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="First Name" />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="lastName"
          >
            <Input prefix={<UserOutlined />} placeholder="Last Name" />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
          >
            <Input prefix={<PhoneOutlined />} placeholder="+1234567890" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Current Password" />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter your new password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm New Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Change Password
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
