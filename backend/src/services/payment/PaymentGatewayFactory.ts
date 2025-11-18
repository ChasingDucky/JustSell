import { PaymentGateway } from './PaymentGateway.interface';
import { StripeGateway } from './StripeGateway';
import { PayPalGateway } from './PayPalGateway';
import { AlipayGateway } from './AlipayGateway';
import { WeChatGateway } from './WeChatGateway';
import { CryptoGateway } from './CryptoGateway';
import { config } from '../../config';

/**
 * Payment Gateway Factory
 * Creates and manages payment gateway instances
 */
export class PaymentGatewayFactory {
  private static gateways: Map<string, PaymentGateway> = new Map();

  /**
   * Get payment gateway by provider name
   */
  static getGateway(provider: string): PaymentGateway {
    // Return cached gateway if exists
    if (this.gateways.has(provider)) {
      return this.gateways.get(provider)!;
    }

    // Create new gateway instance
    let gateway: PaymentGateway;

    switch (provider.toLowerCase()) {
      case 'stripe':
        gateway = new StripeGateway(
          process.env.STRIPE_SECRET_KEY || 'sk_test_demo',
          process.env.STRIPE_WEBHOOK_SECRET || 'whsec_demo'
        );
        break;

      case 'paypal':
        gateway = new PayPalGateway(
          process.env.PAYPAL_CLIENT_ID || 'demo_client_id',
          process.env.PAYPAL_CLIENT_SECRET || 'demo_client_secret',
          (process.env.PAYPAL_MODE as 'sandbox' | 'production') || 'sandbox'
        );
        break;

      case 'alipay':
        gateway = new AlipayGateway(
          process.env.ALIPAY_APP_ID || 'demo_app_id',
          process.env.ALIPAY_PRIVATE_KEY || 'demo_private_key',
          process.env.ALIPAY_PUBLIC_KEY || 'demo_public_key',
          process.env.ALIPAY_GATEWAY_URL
        );
        break;

      case 'wechat':
        gateway = new WeChatGateway(
          process.env.WECHAT_APP_ID || 'demo_app_id',
          process.env.WECHAT_MCH_ID || 'demo_mch_id',
          process.env.WECHAT_API_KEY || 'demo_api_key',
          process.env.WECHAT_CERT_PATH
        );
        break;

      case 'crypto':
      case 'cryptocurrency':
        gateway = new CryptoGateway(
          process.env.CRYPTO_API_KEY || 'demo_api_key',
          process.env.CRYPTO_WEBHOOK_SECRET || 'demo_webhook_secret',
          ['BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'BCH']
        );
        break;

      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }

    // Cache the gateway
    this.gateways.set(provider, gateway);

    return gateway;
  }

  /**
   * Get list of supported payment providers
   */
  static getSupportedProviders(): string[] {
    return ['stripe', 'paypal', 'alipay', 'wechat', 'crypto'];
  }

  /**
   * Check if provider is supported
   */
  static isProviderSupported(provider: string): boolean {
    return this.getSupportedProviders().includes(provider.toLowerCase());
  }

  /**
   * Get payment method configuration for frontend
   */
  static getPaymentMethodsConfig() {
    return [
      {
        provider: 'stripe',
        name: 'Credit/Debit Card',
        method: 'card',
        icon: '💳',
        enabled: !!process.env.STRIPE_SECRET_KEY,
        description: 'Pay with Visa, Mastercard, Amex',
        currencies: ['USD', 'EUR', 'GBP'],
      },
      {
        provider: 'paypal',
        name: 'PayPal',
        method: 'wallet',
        icon: '🅿️',
        enabled: !!process.env.PAYPAL_CLIENT_ID,
        description: 'Pay with your PayPal account',
        currencies: ['USD', 'EUR', 'GBP'],
      },
      {
        provider: 'alipay',
        name: 'Alipay',
        method: 'wallet',
        icon: '💙',
        enabled: !!process.env.ALIPAY_APP_ID,
        description: '支付宝支付',
        currencies: ['CNY', 'USD'],
      },
      {
        provider: 'wechat',
        name: 'WeChat Pay',
        method: 'qrcode',
        icon: '💚',
        enabled: !!process.env.WECHAT_APP_ID,
        description: '微信支付',
        currencies: ['CNY'],
      },
      {
        provider: 'crypto',
        name: 'Cryptocurrency',
        method: 'crypto',
        icon: '₿',
        enabled: true, // Always enabled in demo mode
        description: 'Pay with Bitcoin, Ethereum, USDT, and more',
        currencies: ['USD', 'EUR', 'GBP', 'CNY'],
        supportedCryptos: ['BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'BCH'],
      },
    ];
  }
}
