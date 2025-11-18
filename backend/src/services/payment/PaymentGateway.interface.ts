/**
 * Payment Gateway Interface
 * Abstract interface for all payment providers
 */
export interface PaymentGateway {
  /**
   * Create payment intent/order
   */
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;

  /**
   * Process payment
   */
  processPayment(params: ProcessPaymentParams): Promise<PaymentResult>;

  /**
   * Verify payment callback
   */
  verifyCallback(params: any): Promise<CallbackVerificationResult>;

  /**
   * Refund payment
   */
  refundPayment(transactionId: string, amount: number): Promise<RefundResult>;

  /**
   * Get payment status
   */
  getPaymentStatus(transactionId: string): Promise<PaymentStatusResult>;
}

export interface CreatePaymentParams {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  metadata?: Record<string, any>;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface ProcessPaymentParams {
  paymentId: string;
  token?: string;
  paymentMethodId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentUrl?: string;
  clientSecret?: string;
  qrCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface CallbackVerificationResult {
  valid: boolean;
  transactionId?: string;
  status: 'completed' | 'failed' | 'pending';
  amount?: number;
  metadata?: Record<string, any>;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  errorMessage?: string;
}

export interface PaymentStatusResult {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  amount?: number;
  metadata?: Record<string, any>;
}
