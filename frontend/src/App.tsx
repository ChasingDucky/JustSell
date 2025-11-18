import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Layout } from 'antd';
import './App.css';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import CardDetailPage from './pages/CardDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import DashboardPage from './pages/DashboardPage';
import AIAssistantPage from './pages/AIAssistantPage';
import NotFoundPage from './pages/NotFoundPage';

// Utils
import { setUser } from './store/slices/authSlice';
import PrivateRoute from './components/common/PrivateRoute';

const { Content } = Layout;

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      const user = JSON.parse(userStr);
      dispatch(setUser({ user, token }));
    }
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <Layout className="min-h-screen">
        <Header />
        <Content className="site-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/cards/:id" element={<CardDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <PrivateRoute>
                  <OrdersPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <PrivateRoute>
                  <OrderDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <PrivateRoute>
                  <CartPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <PrivateRoute>
                  <CheckoutPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/payment"
              element={
                <PrivateRoute>
                  <PaymentPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <PrivateRoute>
                  <AIAssistantPage />
                </PrivateRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute roles={['admin']}>
                  <DashboardPage />
                </PrivateRoute>
              }
            />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Content>
        <Footer />
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
