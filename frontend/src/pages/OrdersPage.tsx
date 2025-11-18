import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Typography,
  Empty,
  Table,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Popconfirm,
} from 'antd';
import { EyeOutlined, CloseCircleOutlined, ShoppingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import { Order } from '../types';

const { Title } = Typography;

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    loadOrders();
  }, [pagination.current]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.getOrders(pagination.current, pagination.pageSize);

      if (response.success) {
        setOrders(response.data.orders);
        setPagination({
          ...pagination,
          total: response.data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.cancelOrder(orderId);
      message.success('Order cancelled successfully');
      loadOrders();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    const colors: Record<Order['status'], string> = {
      pending: 'orange',
      paid: 'blue',
      processing: 'cyan',
      completed: 'green',
      cancelled: 'red',
      refunded: 'purple',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (orderNumber: string, record: Order) => (
        <Link to={`/orders/${record.id}`}>
          <Button type="link" style={{ padding: 0 }}>
            {orderNumber}
          </Button>
        </Link>
      ),
    },
    {
      title: 'Card',
      dataIndex: 'card',
      key: 'card',
      render: (card: any) => card?.name || 'N/A',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Amount',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      render: (amount: number, record: Order) => (
        <span style={{ fontWeight: 'bold', color: '#f5222d' }}>
          ${amount.toFixed(2)} {record.currency}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: Order['status']) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space>
          <Link to={`/orders/${record.id}`}>
            <Button type="primary" size="small" icon={<EyeOutlined />}>
              View
            </Button>
          </Link>
          {record.status === 'pending' && (
            <Popconfirm
              title="Are you sure you want to cancel this order?"
              onConfirm={() => handleCancelOrder(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger size="small" icon={<CloseCircleOutlined />}>
                Cancel
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (loading && orders.length === 0) {
    return (
      <div className="container">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <div className="container">
        <Card>
          <Empty
            description="No orders yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Link to="/search">
              <Button type="primary" icon={<ShoppingOutlined />}>
                Start Shopping
              </Button>
            </Link>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="container">
      <Title level={2}>My Orders</Title>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page) => setPagination({ ...pagination, current: page }),
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} orders`,
          }}
        />
      </Card>
    </div>
  );
};

export default OrdersPage;
