export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'customer' | 'admin' | 'supplier';
  status: 'active' | 'inactive' | 'suspended';
}

export interface Card {
  id: string;
  name: string;
  description?: string;
  category: string;
  denomination: number;
  price: number;
  discount: number;
  currency: string;
  stock: number;
  imageUrl?: string;
  tags?: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  supplier?: Supplier;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  description?: string;
  rating: number;
  totalSales: number;
  status: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  cardId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  currency: string;
  status: 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod?: string;
  deliveryEmail?: string;
  deliveryPhone?: string;
  card?: Card;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: string;
}

export interface SearchFilters {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}
