/**
 * Virtual Product Types and Categories
 * Comprehensive categorization of all digital/virtual products
 */

export enum VirtualProductCategory {
  // Gaming
  GAME_CARD = 'game_card',
  GAME_ACCOUNT = 'game_account',
  GAME_ITEM = 'game_item',
  GAME_CURRENCY = 'game_currency',
  GAME_SUBSCRIPTION = 'game_subscription',

  // Software & Licenses
  SOFTWARE_LICENSE = 'software_license',
  OPERATING_SYSTEM = 'operating_system',
  ANTIVIRUS = 'antivirus',
  VPN_SERVICE = 'vpn_service',
  PROXY_SERVICE = 'proxy_service',

  // Entertainment & Media
  STREAMING_SUBSCRIPTION = 'streaming_subscription',
  MUSIC_SUBSCRIPTION = 'music_subscription',
  EBOOK = 'ebook',
  AUDIOBOOK = 'audiobook',
  VIDEO_CONTENT = 'video_content',
  PODCAST_SUBSCRIPTION = 'podcast_subscription',

  // Telecommunications
  MOBILE_RECHARGE = 'mobile_recharge',
  PHONE_NUMBER = 'phone_number',
  SMS_SERVICE = 'sms_service',

  // Gift Cards & Vouchers
  GIFT_CARD = 'gift_card',
  SHOPPING_VOUCHER = 'shopping_voucher',
  COUPON_CODE = 'coupon_code',
  DISCOUNT_CODE = 'discount_code',

  // Cloud Services
  CLOUD_STORAGE = 'cloud_storage',
  CLOUD_COMPUTING = 'cloud_computing',
  WEB_HOSTING = 'web_hosting',
  DOMAIN_NAME = 'domain_name',
  EMAIL_HOSTING = 'email_hosting',

  // Cryptocurrency & NFT
  CRYPTO_VOUCHER = 'crypto_voucher',
  NFT = 'nft',
  CRYPTO_WALLET = 'crypto_wallet',

  // Education & Training
  ONLINE_COURSE = 'online_course',
  CERTIFICATION = 'certification',
  EBOOK_TEXTBOOK = 'ebook_textbook',
  TUTORIAL_ACCESS = 'tutorial_access',

  // Membership & Access
  PREMIUM_MEMBERSHIP = 'premium_membership',
  CLUB_ACCESS = 'club_access',
  EVENT_TICKET = 'event_ticket',
  WEBINAR_ACCESS = 'webinar_access',

  // Social Media & Marketing
  SOCIAL_FOLLOWERS = 'social_followers',
  ADVERTISING_CREDIT = 'advertising_credit',
  SEO_TOOLS = 'seo_tools',

  // Other
  OTHER = 'other',
}

export enum ProductDeliveryType {
  CODE = 'code',              // Activation code/key
  ACCOUNT = 'account',        // Username/password
  DIGITAL_FILE = 'file',      // Downloadable file
  API_ACCESS = 'api',         // API key/token
  EMAIL_LINK = 'link',        // Access link via email
  QR_CODE = 'qr',            // QR code scan
  BLOCKCHAIN = 'blockchain',  // NFT/Crypto on-chain
}

export interface VirtualProductMetadata {
  // Gaming specific
  platform?: string[];        // PC, Xbox, PlayStation, Switch, Mobile
  region?: string[];          // Global, NA, EU, Asia, etc.
  language?: string[];        // en, zh, ja, ko, etc.

  // Software specific
  version?: string;
  os?: string[];             // Windows, Mac, Linux, Android, iOS
  license_type?: string;     // Lifetime, Annual, Monthly
  devices?: number;          // Number of devices allowed

  // Media specific
  format?: string;           // PDF, EPUB, MP3, MP4, etc.
  duration?: number;         // For subscriptions (months)
  resolution?: string;       // HD, 4K, etc.

  // Service specific
  data_amount?: string;      // For mobile recharge, VPN, etc.
  validity?: number;         // Days valid

  // NFT/Crypto specific
  blockchain?: string;       // Ethereum, Polygon, Solana, etc.
  contract_address?: string;
  token_id?: string;

  // General
  instant_delivery?: boolean;
  auto_renewal?: boolean;
  refundable?: boolean;
}

export interface ProductCategoryInfo {
  category: VirtualProductCategory;
  name: string;
  description: string;
  icon: string;
  deliveryTypes: ProductDeliveryType[];
  requiresAccount: boolean;
}

export const PRODUCT_CATEGORIES: ProductCategoryInfo[] = [
  {
    category: VirtualProductCategory.GAME_CARD,
    name: 'Game Cards',
    description: 'Gift cards and prepaid cards for gaming platforms',
    icon: '🎮',
    deliveryTypes: [ProductDeliveryType.CODE],
    requiresAccount: false,
  },
  {
    category: VirtualProductCategory.GAME_ACCOUNT,
    name: 'Game Accounts',
    description: 'Pre-leveled or special game accounts',
    icon: '👤',
    deliveryTypes: [ProductDeliveryType.ACCOUNT],
    requiresAccount: false,
  },
  {
    category: VirtualProductCategory.SOFTWARE_LICENSE,
    name: 'Software Licenses',
    description: 'License keys for software applications',
    icon: '💻',
    deliveryTypes: [ProductDeliveryType.CODE, ProductDeliveryType.EMAIL_LINK],
    requiresAccount: false,
  },
  {
    category: VirtualProductCategory.VPN_SERVICE,
    name: 'VPN Services',
    description: 'Virtual Private Network subscriptions',
    icon: '🔒',
    deliveryTypes: [ProductDeliveryType.CODE, ProductDeliveryType.ACCOUNT],
    requiresAccount: false,
  },
  {
    category: VirtualProductCategory.STREAMING_SUBSCRIPTION,
    name: 'Streaming Services',
    description: 'Netflix, Disney+, HBO Max, and more',
    icon: '📺',
    deliveryTypes: [ProductDeliveryType.CODE, ProductDeliveryType.ACCOUNT],
    requiresAccount: false,
  },
  {
    category: VirtualProductCategory.MOBILE_RECHARGE,
    name: 'Mobile Recharge',
    description: 'Top-up your mobile phone',
    icon: '📱',
    deliveryTypes: [ProductDeliveryType.CODE],
    requiresAccount: false,
  },
  {
    category: VirtualProductCategory.GIFT_CARD,
    name: 'Gift Cards',
    description: 'Gift cards for online and retail stores',
    icon: '🎁',
    deliveryTypes: [ProductDeliveryType.CODE, ProductDeliveryType.QR_CODE],
    requiresAccount: false,
  },
  {
    category: VirtualProductCategory.CLOUD_STORAGE,
    name: 'Cloud Storage',
    description: 'Online storage and backup services',
    icon: '☁️',
    deliveryTypes: [ProductDeliveryType.CODE, ProductDeliveryType.API_ACCESS],
    requiresAccount: false,
  },
  {
    category: VirtualProductCategory.NFT,
    name: 'NFTs',
    description: 'Non-Fungible Tokens and digital collectibles',
    icon: '🖼️',
    deliveryTypes: [ProductDeliveryType.BLOCKCHAIN],
    requiresAccount: true,
  },
  {
    category: VirtualProductCategory.CRYPTO_VOUCHER,
    name: 'Crypto Vouchers',
    description: 'Cryptocurrency gift cards and vouchers',
    icon: '₿',
    deliveryTypes: [ProductDeliveryType.CODE],
    requiresAccount: false,
  },
  {
    category: VirtualProductCategory.ONLINE_COURSE,
    name: 'Online Courses',
    description: 'Educational courses and training programs',
    icon: '📚',
    deliveryTypes: [ProductDeliveryType.EMAIL_LINK, ProductDeliveryType.ACCOUNT],
    requiresAccount: false,
  },
  {
    category: VirtualProductCategory.EBOOK,
    name: 'E-Books',
    description: 'Digital books and publications',
    icon: '📖',
    deliveryTypes: [ProductDeliveryType.DIGITAL_FILE, ProductDeliveryType.EMAIL_LINK],
    requiresAccount: false,
  },
];

/**
 * Get category info by category enum
 */
export function getCategoryInfo(category: VirtualProductCategory): ProductCategoryInfo | undefined {
  return PRODUCT_CATEGORIES.find(c => c.category === category);
}

/**
 * Get all categories by delivery type
 */
export function getCategoriesByDeliveryType(deliveryType: ProductDeliveryType): ProductCategoryInfo[] {
  return PRODUCT_CATEGORIES.filter(c => c.deliveryTypes.includes(deliveryType));
}

/**
 * Validate product metadata based on category
 */
export function validateProductMetadata(
  category: VirtualProductCategory,
  metadata: VirtualProductMetadata
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Category-specific validation
  switch (category) {
    case VirtualProductCategory.GAME_CARD:
    case VirtualProductCategory.GAME_ACCOUNT:
      if (!metadata.platform || metadata.platform.length === 0) {
        errors.push('Platform is required for gaming products');
      }
      break;

    case VirtualProductCategory.SOFTWARE_LICENSE:
      if (!metadata.os || metadata.os.length === 0) {
        errors.push('Operating system is required for software');
      }
      break;

    case VirtualProductCategory.NFT:
      if (!metadata.blockchain) {
        errors.push('Blockchain is required for NFTs');
      }
      if (!metadata.contract_address) {
        errors.push('Contract address is required for NFTs');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
