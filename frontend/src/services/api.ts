import axios, { AxiosInstance, AxiosError } from 'axios';
import { message } from 'antd';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError<any>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }

        const errorMessage =
          error.response?.data?.message || 'An error occurred';
        message.error(errorMessage);

        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    return this.api.post('/auth/login', { email, password });
  }

  async register(data: any) {
    return this.api.post('/auth/register', data);
  }

  async logout() {
    return this.api.post('/auth/logout');
  }

  async getProfile() {
    return this.api.get('/auth/profile');
  }

  // Cards
  async getCards(params?: any) {
    return this.api.get('/cards', { params });
  }

  async getCardById(id: string) {
    return this.api.get(`/cards/${id}`);
  }

  async getPopularCards(limit?: number) {
    return this.api.get('/cards/popular', { params: { limit } });
  }

  // Search
  async search(params: any) {
    return this.api.get('/search', { params });
  }

  async getSearchSuggestions(keyword: string) {
    return this.api.get('/search/suggestions', { params: { keyword } });
  }

  async getCategories() {
    return this.api.get('/search/categories');
  }

  async getTrendingSearches() {
    return this.api.get('/search/trending');
  }

  // Orders
  async createOrder(data: any) {
    return this.api.post('/orders', data);
  }

  async getOrders(page?: number, limit?: number) {
    return this.api.get('/orders', { params: { page, limit } });
  }

  async getOrderById(id: string) {
    return this.api.get(`/orders/${id}`);
  }

  async cancelOrder(id: string) {
    return this.api.post(`/orders/${id}/cancel`);
  }

  // Payments
  async createPayment(data: any) {
    return this.api.post('/payments', data);
  }

  async processStripePayment(id: string, token: string) {
    return this.api.post(`/payments/${id}/stripe`, { token });
  }

  async processPayPalPayment(id: string, paypalOrderId: string) {
    return this.api.post(`/payments/${id}/paypal`, { paypalOrderId });
  }

  // Recommendations
  async getPersonalizedRecommendations(limit?: number) {
    return this.api.get('/recommendations/personalized', { params: { limit } });
  }

  async getBestDeals(limit?: number) {
    return this.api.get('/recommendations/deals', { params: { limit } });
  }

  async getTrendingCards(limit?: number) {
    return this.api.get('/recommendations/trending', { params: { limit } });
  }

  async getSimilarCards(cardId: string, limit?: number) {
    return this.api.get(`/recommendations/similar/${cardId}`, {
      params: { limit },
    });
  }

  // Analytics (Admin)
  async getDashboardStats() {
    return this.api.get('/analytics/dashboard');
  }

  async getSalesByDateRange(startDate: string, endDate: string) {
    return this.api.get('/analytics/sales', { params: { startDate, endDate } });
  }

  async getTopSellingCards(limit?: number, days?: number) {
    return this.api.get('/analytics/top-cards', { params: { limit, days } });
  }
}

export default new ApiService();
