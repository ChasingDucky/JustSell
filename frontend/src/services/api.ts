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

  async updateProfile(data: any) {
    return this.api.put('/users/profile', data);
  }

  async changePassword(data: any) {
    return this.api.post('/users/change-password', data);
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
  async getPaymentMethods() {
    return this.api.get('/payments/methods');
  }

  async createPayment(data: any) {
    return this.api.post('/payments', data);
  }

  async processPayment(id: string, data?: any) {
    return this.api.post(`/payments/${id}/process`, data);
  }

  async getPaymentById(id: string) {
    return this.api.get(`/payments/${id}`);
  }

  async refundPayment(id: string, reason?: string) {
    return this.api.post(`/payments/${id}/refund`, { reason });
  }

  // Legacy payment methods (deprecated, use processPayment instead)
  async processStripePayment(id: string, token: string) {
    return this.processPayment(id, { token });
  }

  async processPayPalPayment(id: string, paypalOrderId: string) {
    return this.processPayment(id, { token: paypalOrderId });
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

  async getRevenueByCategory(days?: number) {
    return this.api.get('/analytics/revenue-by-category', { params: { days } });
  }

  async getCustomerInsights() {
    return this.api.get('/analytics/customer-insights');
  }

  async getSupplierPerformance(limit?: number) {
    return this.api.get('/analytics/supplier-performance', { params: { limit } });
  }

  // Reviews
  async getCardReviews(cardId: string, page?: number, limit?: number) {
    return this.api.get(`/reviews/card/${cardId}`, { params: { page, limit } });
  }

  async getCardReviewStats(cardId: string) {
    return this.api.get(`/reviews/card/${cardId}/stats`);
  }

  async getUserReviews(page?: number, limit?: number) {
    return this.api.get('/reviews/user', { params: { page, limit } });
  }

  async getReviewById(id: string) {
    return this.api.get(`/reviews/${id}`);
  }

  async createReview(data: any) {
    return this.api.post('/reviews', data);
  }

  async updateReview(id: string, data: any) {
    return this.api.put(`/reviews/${id}`, data);
  }

  async deleteReview(id: string) {
    return this.api.delete(`/reviews/${id}`);
  }

  async markReviewHelpful(id: string) {
    return this.api.post(`/reviews/${id}/helpful`);
  }

  // Seller Management
  async applyAsSeller(data: any) {
    return this.api.post('/sellers/apply', data);
  }

  async getSellerProfile() {
    return this.api.get('/sellers/me');
  }

  async getSellerDashboard() {
    return this.api.get('/sellers/dashboard');
  }

  async updateSellerProfile(data: any) {
    return this.api.put('/sellers/profile', data);
  }

  async getSellerById(id: string) {
    return this.api.get(`/sellers/${id}`);
  }

  // User Listings
  async createListing(data: any) {
    return this.api.post('/listings', data);
  }

  async getMyListings(params?: any) {
    return this.api.get('/listings/my-listings', { params });
  }

  async searchListings(params: any) {
    return this.api.get('/listings/search', { params });
  }

  async getListingById(id: string, incrementView?: boolean) {
    return this.api.get(`/listings/${id}`, { params: { view: incrementView } });
  }

  async updateListing(id: string, data: any) {
    return this.api.put(`/listings/${id}`, data);
  }

  async submitListingForReview(id: string) {
    return this.api.post(`/listings/${id}/submit`);
  }

  async updateListingStock(id: string, stock: number) {
    return this.api.patch(`/listings/${id}/stock`, { stock });
  }

  async deleteListing(id: string) {
    return this.api.delete(`/listings/${id}`);
  }

  async toggleListingFavorite(id: string, increment: boolean) {
    return this.api.post(`/listings/${id}/favorite`, { increment });
  }

  // Escrow
  async getEscrowByOrderId(orderId: string) {
    return this.api.get(`/escrow/order/${orderId}`);
  }

  async getBuyerEscrows(status?: string) {
    return this.api.get('/escrow/buyer/my-escrows', { params: { status } });
  }

  async getSellerEscrows(status?: string) {
    return this.api.get('/escrow/seller/my-escrows', { params: { status } });
  }

  async releaseEscrow(id: string) {
    return this.api.post(`/escrow/${id}/release`);
  }

  async refundEscrow(id: string, reason: string) {
    return this.api.post(`/escrow/${id}/refund`, { reason });
  }

  // Disputes
  async createDispute(data: any) {
    return this.api.post('/disputes', data);
  }

  async getBuyerDisputes() {
    return this.api.get('/disputes/buyer/my-disputes');
  }

  async getSellerDisputes() {
    return this.api.get('/disputes/seller/my-disputes');
  }

  async getDisputeById(id: string) {
    return this.api.get(`/disputes/${id}`);
  }

  async addSellerResponse(id: string, response: string) {
    return this.api.post(`/disputes/${id}/seller-response`, { response });
  }

  async addBuyerResponse(id: string, response: string) {
    return this.api.post(`/disputes/${id}/buyer-response`, { response });
  }

  async addDisputeEvidence(id: string, evidenceUrl: string) {
    return this.api.post(`/disputes/${id}/evidence`, { evidenceUrl });
  }

  // Admin - Sellers
  async getAllSellers(params?: any) {
    return this.api.get('/sellers', { params });
  }

  async approveSeller(id: string) {
    return this.api.post(`/sellers/${id}/approve`);
  }

  async rejectSeller(id: string, reason: string) {
    return this.api.post(`/sellers/${id}/reject`, { reason });
  }

  async suspendSeller(id: string, reason: string) {
    return this.api.post(`/sellers/${id}/suspend`, { reason });
  }

  async reactivateSeller(id: string) {
    return this.api.post(`/sellers/${id}/reactivate`);
  }

  // Admin - Listings
  async getPendingListings(page?: number, limit?: number) {
    return this.api.get('/listings/admin/pending', { params: { page, limit } });
  }

  async approveListing(id: string, notes?: string) {
    return this.api.post(`/listings/${id}/approve`, { notes });
  }

  async rejectListing(id: string, reason: string) {
    return this.api.post(`/listings/${id}/reject`, { reason });
  }

  async suspendListing(id: string, reason: string) {
    return this.api.post(`/listings/${id}/suspend`, { reason });
  }

  // Admin - Disputes
  async getAllDisputes(params?: any) {
    return this.api.get('/disputes', { params });
  }

  async assignDispute(id: string, adminId?: string) {
    return this.api.post(`/disputes/${id}/assign`, { adminId });
  }

  async resolveDispute(id: string, resolution: string, notes?: string, refundAmount?: number) {
    return this.api.post(`/disputes/${id}/resolve`, { resolution, notes, refundAmount });
  }

  async closeDispute(id: string) {
    return this.api.post(`/disputes/${id}/close`);
  }

  async escalateDispute(id: string) {
    return this.api.post(`/disputes/${id}/escalate`);
  }

  async getDisputeStats() {
    return this.api.get('/disputes/admin/stats');
  }

  // Admin - Escrow
  async getEscrowStats() {
    return this.api.get('/escrow/admin/stats');
  }

  async adminReleaseEscrow(id: string) {
    return this.api.post(`/escrow/${id}/admin-release`);
  }

  async adminRefundEscrow(id: string, reason: string) {
    return this.api.post(`/escrow/${id}/admin-refund`, { reason });
  }

  // Subscriptions
  async createSubscription(data: any) {
    return this.api.post('/subscriptions', data);
  }

  async getMySubscriptions(filters?: any) {
    return this.api.get('/subscriptions/my-subscriptions', { params: filters });
  }

  async getSubscriptionAnalytics() {
    return this.api.get('/subscriptions/analytics');
  }

  async getSavingsSuggestions() {
    return this.api.get('/subscriptions/savings-suggestions');
  }

  async updateSubscription(id: string, data: any) {
    return this.api.put(`/subscriptions/${id}`, data);
  }

  async cancelSubscription(id: string) {
    return this.api.post(`/subscriptions/${id}/cancel`);
  }

  async deleteSubscription(id: string) {
    return this.api.delete(`/subscriptions/${id}`);
  }

  // SubONE Membership
  async getSubONETiers() {
    return this.api.get('/subone/tiers');
  }

  async calculateSubONESavings(currentCost: number) {
    return this.api.get('/subone/calculate-savings', { params: { currentCost } });
  }

  async subscribeToSubONE(tier: string, duration?: number) {
    return this.api.post('/subone/subscribe', { tier, duration });
  }

  async getMySubONEMembership() {
    return this.api.get('/subone/my-membership');
  }

  async upgradeSubONE(tier: string) {
    return this.api.post('/subone/upgrade', { tier });
  }

  async addSubONEFamilyMember(email: string) {
    return this.api.post('/subone/family/add', { email });
  }

  async removeSubONEFamilyMember(memberUserId: string) {
    return this.api.post('/subone/family/remove', { memberUserId });
  }

  async activateSubONETrial() {
    return this.api.post('/subone/activate-trial');
  }

  async cancelSubONE(reason?: string) {
    return this.api.post('/subone/cancel', { reason });
  }

  async reactivateSubONE() {
    return this.api.post('/subone/reactivate');
  }

  // Shipping Addresses
  async createAddress(data: any) {
    return this.api.post('/addresses', data);
  }

  async getUserAddresses() {
    return this.api.get('/addresses');
  }

  async getDefaultAddress() {
    return this.api.get('/addresses/default');
  }

  async getAddressById(id: string) {
    return this.api.get(`/addresses/${id}`);
  }

  async updateAddress(id: string, data: any) {
    return this.api.put(`/addresses/${id}`, data);
  }

  async setDefaultAddress(id: string) {
    return this.api.post(`/addresses/${id}/set-default`);
  }

  async deleteAddress(id: string) {
    return this.api.delete(`/addresses/${id}`);
  }

  async validateAddress(data: any) {
    return this.api.post('/addresses/validate', data);
  }

  // Shipping & Logistics
  async calculateShippingRates(data: any) {
    return this.api.post('/shipping/calculate-rates', data);
  }

  async createShipment(data: any) {
    return this.api.post('/shipping', data);
  }

  async trackShipment(trackingNumber: string) {
    return this.api.get(`/shipping/track/${trackingNumber}`);
  }

  async getMyShipments(status?: string) {
    return this.api.get('/shipping/my-shipments', { params: { status } });
  }

  async confirmDelivery(id: string) {
    return this.api.post(`/shipping/${id}/confirm-delivery`);
  }

  async cancelShipment(id: string, reason?: string) {
    return this.api.post(`/shipping/${id}/cancel`, { reason });
  }

  async updateShipmentStatus(id: string, data: any) {
    return this.api.post(`/shipping/${id}/update-status`, data);
  }

  // User Profile & Preferences
  async getUserProfile() {
    return this.api.get('/profile');
  }

  async getProfileInsights() {
    return this.api.get('/profile/insights');
  }

  async updateDemographics(data: any) {
    return this.api.put('/profile/demographics', data);
  }

  async updatePreferredCategories(categories: string[]) {
    return this.api.put('/profile/preferences/categories', { categories });
  }

  async blockCategory(category: string) {
    return this.api.post('/profile/block/category', { category });
  }

  async unblockCategory(category: string) {
    return this.api.post('/profile/unblock/category', { category });
  }

  async blockSeller(sellerId: string) {
    return this.api.post('/profile/block/seller', { sellerId });
  }

  async unblockSeller(sellerId: string) {
    return this.api.post('/profile/unblock/seller', { sellerId });
  }

  async updatePricePreference(minPrice?: number, maxPrice?: number) {
    return this.api.put('/profile/preferences/price', { minPrice, maxPrice });
  }

  async updateRecommendationSettings(settings: any) {
    return this.api.put('/profile/preferences/recommendations', settings);
  }

  async rebuildProfile() {
    return this.api.post('/profile/rebuild');
  }

  // Smart Recommendations
  async getPersonalizedRecommendations(params?: any) {
    return this.api.get('/smart-recommendations/personalized', { params });
  }

  async getSimilarItems(itemType: 'card' | 'listing', itemId: string, limit?: number) {
    return this.api.get(`/smart-recommendations/similar/${itemType}/${itemId}`, {
      params: { limit },
    });
  }

  async recordRecommendationFeedback(data: any) {
    return this.api.post('/smart-recommendations/feedback', data);
  }

  async trackBehavior(data: any) {
    return this.api.post('/smart-recommendations/track', data);
  }

  async getBehaviorAnalytics(days?: number) {
    return this.api.get('/smart-recommendations/analytics/behavior', {
      params: { days },
    });
  }

  async getRecentViews(limit?: number) {
    return this.api.get('/smart-recommendations/history/views', {
      params: { limit },
    });
  }

  async getPurchaseHistory(limit?: number) {
    return this.api.get('/smart-recommendations/history/purchases', {
      params: { limit },
    });
  }

  // AI Shopping Assistants
  async getAIAgents() {
    return this.api.get('/ai-assistant/agents');
  }

  async startAIConversation(sessionId?: string) {
    return this.api.post('/ai-assistant/conversation/start', { sessionId });
  }

  async chatWithAI(data: {
    conversationId?: string;
    message: string;
    agentType?: string;
  }) {
    return this.api.post('/ai-assistant/chat', data);
  }

  async getAIConversationHistory(conversationId: string) {
    return this.api.get(`/ai-assistant/conversation/${conversationId}/history`);
  }

  async switchAIAgent(conversationId: string, agentType: string) {
    return this.api.post(`/ai-assistant/conversation/${conversationId}/switch-agent`, {
      agentType,
    });
  }

  async clearAIConversation(conversationId: string) {
    return this.api.delete(`/ai-assistant/conversation/${conversationId}`);
  }

  async quickAIQuery(message: string, agentType?: string) {
    return this.api.post('/ai-assistant/quick-query', { message, agentType });
  }

  // AI Settings
  async getAISettings() {
    return this.api.get('/ai-settings');
  }

  async updateGeminiApiKey(geminiApiKey: string) {
    return this.api.post('/ai-settings/api-key', { geminiApiKey });
  }

  async removeGeminiApiKey() {
    return this.api.delete('/ai-settings/api-key');
  }

  async updateAIPreferences(preferences: {
    enableAI?: boolean;
    preferredModel?: string;
  }) {
    return this.api.put('/ai-settings/preferences', preferences);
  }

  async getAvailableAIModels() {
    return this.api.get('/ai-settings/models');
  }

  // AI Assistant
  async getAvailableAgents() {
    return this.api.get('/ai-assistant/agents');
  }

  async chatWithAI(data: {
    message: string;
    conversationId?: string;
    agentType?: string;
  }) {
    return this.api.post('/ai-assistant/chat', data);
  }

  async getConversationHistory(conversationId: string) {
    return this.api.get(`/ai-assistant/conversations/${conversationId}`);
  }

  async switchAgent(conversationId: string, agentType: string) {
    return this.api.post(`/ai-assistant/conversations/${conversationId}/switch-agent`, {
      agentType,
    });
  }

  async clearConversation(conversationId: string) {
    return this.api.delete(`/ai-assistant/conversations/${conversationId}`);
  }
}

export default new ApiService();
