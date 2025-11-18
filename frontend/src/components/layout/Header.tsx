import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Layout, Menu, Button, Badge, Dropdown, Avatar, Input } from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SearchOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import api from '../../services/api';

const { Header: AntHeader } = Layout;
const { Search } = Input;

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.cart);

  const handleLogout = async () => {
    await api.logout();
    dispatch(logout());
    navigate('/login');
  };

  const handleSearch = (value: string) => {
    navigate(`/search?keyword=${value}`);
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link to="/profile">Profile</Link>
      </Menu.Item>
      <Menu.Item key="orders" icon={<ShoppingCartOutlined />}>
        <Link to="/orders">My Orders</Link>
      </Menu.Item>
      {user?.role === 'admin' && (
        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
          <Link to="/dashboard">Dashboard</Link>
        </Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <AntHeader style={{ display: 'flex', alignItems: 'center', padding: '0 50px' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '40px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <h1 style={{ color: '#1890ff', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            CardSky
          </h1>
        </Link>

        <Search
          placeholder="Search cards..."
          allowClear
          onSearch={handleSearch}
          style={{ width: 400 }}
          prefix={<SearchOutlined />}
        />

        <Menu mode="horizontal" defaultSelectedKeys={['home']} style={{ flex: 1, border: 'none' }}>
          <Menu.Item key="home">
            <Link to="/">Home</Link>
          </Menu.Item>
          <Menu.Item key="browse">
            <Link to="/search">Browse Cards</Link>
          </Menu.Item>
          {isAuthenticated && (
            <Menu.Item key="ai-assistant" icon={<RobotOutlined />}>
              <Link to="/ai-assistant">AI Assistant</Link>
            </Menu.Item>
          )}
        </Menu>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to="/cart">
          <Badge count={items.length} offset={[10, 0]}>
            <Button type="text" icon={<ShoppingCartOutlined style={{ fontSize: '20px' }} />} />
          </Badge>
        </Link>

        {isAuthenticated ? (
          <Dropdown overlay={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.firstName || user?.email}</span>
            </div>
          </Dropdown>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login">
              <Button type="primary">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </div>
        )}
      </div>
    </AntHeader>
  );
};

export default Header;
