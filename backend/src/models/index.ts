import { User } from './User';
import { Supplier } from './Supplier';
import { Card } from './Card';
import { CardCode } from './CardCode';
import { Order } from './Order';
import { Payment } from './Payment';
import Review from './review.model';
import Seller from './Seller';
import UserListing from './UserListing';
import Escrow from './Escrow';
import Dispute from './Dispute';
import Subscription from './Subscription';
import SubONEMembership from './SubONEMembership';
import ShippingAddress from './ShippingAddress';
import Shipment from './Shipment';
import UserProfile from './UserProfile';
import UserBehavior from './UserBehavior';
import RecommendationFeedback from './RecommendationFeedback';
import UserAISettings from './UserAISettings';
import Conversation from './Conversation';
import Message from './Message';

// Define associations

// User <-> Supplier (One-to-One)
User.hasOne(Supplier, {
  foreignKey: 'userId',
  as: 'supplier',
});
Supplier.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Supplier <-> Card (One-to-Many)
Supplier.hasMany(Card, {
  foreignKey: 'supplierId',
  as: 'cards',
});
Card.belongsTo(Supplier, {
  foreignKey: 'supplierId',
  as: 'supplier',
});

// Card <-> CardCode (One-to-Many)
Card.hasMany(CardCode, {
  foreignKey: 'cardId',
  as: 'codes',
});
CardCode.belongsTo(Card, {
  foreignKey: 'cardId',
  as: 'card',
});

// User <-> Order (One-to-Many)
User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders',
});
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Card <-> Order (One-to-Many)
Card.hasMany(Order, {
  foreignKey: 'cardId',
  as: 'orders',
});
Order.belongsTo(Card, {
  foreignKey: 'cardId',
  as: 'card',
});

// Order <-> CardCode (One-to-Many)
Order.hasMany(CardCode, {
  foreignKey: 'orderId',
  as: 'cardCodes',
});
CardCode.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// Order <-> Payment (One-to-Many)
Order.hasMany(Payment, {
  foreignKey: 'orderId',
  as: 'payments',
});
Payment.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// User <-> Payment (One-to-Many)
User.hasMany(Payment, {
  foreignKey: 'userId',
  as: 'payments',
});
Payment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User <-> Review (One-to-Many)
User.hasMany(Review, {
  foreignKey: 'userId',
  as: 'reviews',
});
Review.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Card <-> Review (One-to-Many)
Card.hasMany(Review, {
  foreignKey: 'cardId',
  as: 'reviews',
});
Review.belongsTo(Card, {
  foreignKey: 'cardId',
  as: 'card',
});

// Order <-> Review (One-to-One)
Order.hasOne(Review, {
  foreignKey: 'orderId',
  as: 'review',
});
Review.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// User <-> Seller (One-to-One)
User.hasOne(Seller, {
  foreignKey: 'userId',
  as: 'seller',
});
Seller.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Seller <-> UserListing (One-to-Many)
Seller.hasMany(UserListing, {
  foreignKey: 'sellerId',
  as: 'listings',
});
UserListing.belongsTo(Seller, {
  foreignKey: 'sellerId',
  as: 'seller',
});

// Order <-> Escrow (One-to-One)
Order.hasOne(Escrow, {
  foreignKey: 'orderId',
  as: 'escrow',
});
Escrow.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// Seller <-> Escrow (One-to-Many)
Seller.hasMany(Escrow, {
  foreignKey: 'sellerId',
  as: 'escrows',
});
Escrow.belongsTo(Seller, {
  foreignKey: 'sellerId',
  as: 'seller',
});

// UserListing <-> Escrow (One-to-Many)
UserListing.hasMany(Escrow, {
  foreignKey: 'listingId',
  as: 'escrows',
});
Escrow.belongsTo(UserListing, {
  foreignKey: 'listingId',
  as: 'listing',
});

// Order <-> Dispute (One-to-Many)
Order.hasMany(Dispute, {
  foreignKey: 'orderId',
  as: 'disputes',
});
Dispute.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// Seller <-> Dispute (One-to-Many)
Seller.hasMany(Dispute, {
  foreignKey: 'sellerId',
  as: 'disputes',
});
Dispute.belongsTo(Seller, {
  foreignKey: 'sellerId',
  as: 'seller',
});

// User <-> Dispute (One-to-Many) for buyer
User.hasMany(Dispute, {
  foreignKey: 'buyerId',
  as: 'disputes',
});
Dispute.belongsTo(User, {
  foreignKey: 'buyerId',
  as: 'buyer',
});

// UserListing <-> Dispute (One-to-Many)
UserListing.hasMany(Dispute, {
  foreignKey: 'listingId',
  as: 'disputes',
});
Dispute.belongsTo(UserListing, {
  foreignKey: 'listingId',
  as: 'listing',
});

// Escrow <-> Dispute (One-to-Many)
Escrow.hasMany(Dispute, {
  foreignKey: 'escrowId',
  as: 'disputes',
});
Dispute.belongsTo(Escrow, {
  foreignKey: 'escrowId',
  as: 'escrow',
});

// User <-> Subscription (One-to-Many)
User.hasMany(Subscription, {
  foreignKey: 'userId',
  as: 'subscriptions',
});
Subscription.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Card <-> Subscription (One-to-Many)
Card.hasMany(Subscription, {
  foreignKey: 'cardId',
  as: 'subscriptions',
});
Subscription.belongsTo(Card, {
  foreignKey: 'cardId',
  as: 'card',
});

// Order <-> Subscription (One-to-Many)
Order.hasMany(Subscription, {
  foreignKey: 'orderId',
  as: 'subscriptions',
});
Subscription.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// UserListing <-> Subscription (One-to-Many)
UserListing.hasMany(Subscription, {
  foreignKey: 'listingId',
  as: 'subscriptions',
});
Subscription.belongsTo(UserListing, {
  foreignKey: 'listingId',
  as: 'listing',
});

// User <-> SubONEMembership (One-to-Many)
User.hasMany(SubONEMembership, {
  foreignKey: 'userId',
  as: 'suboneMemberships',
});
SubONEMembership.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User <-> ShippingAddress (One-to-Many)
User.hasMany(ShippingAddress, {
  foreignKey: 'userId',
  as: 'shippingAddresses',
});
ShippingAddress.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Order <-> Shipment (One-to-One)
Order.hasOne(Shipment, {
  foreignKey: 'orderId',
  as: 'shipment',
});
Shipment.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// User <-> Shipment (One-to-Many)
User.hasMany(Shipment, {
  foreignKey: 'userId',
  as: 'shipments',
});
Shipment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Seller <-> Shipment (One-to-Many)
Seller.hasMany(Shipment, {
  foreignKey: 'sellerId',
  as: 'shipments',
});
Shipment.belongsTo(Seller, {
  foreignKey: 'sellerId',
  as: 'seller',
});

// ShippingAddress <-> Shipment (One-to-Many)
ShippingAddress.hasMany(Shipment, {
  foreignKey: 'shippingAddressId',
  as: 'shipments',
});
Shipment.belongsTo(ShippingAddress, {
  foreignKey: 'shippingAddressId',
  as: 'shippingAddress',
});

// User <-> UserProfile (One-to-One)
User.hasOne(UserProfile, {
  foreignKey: 'userId',
  as: 'profile',
});
UserProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User <-> UserBehavior (One-to-Many)
User.hasMany(UserBehavior, {
  foreignKey: 'userId',
  as: 'behaviors',
});
UserBehavior.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User <-> RecommendationFeedback (One-to-Many)
User.hasMany(RecommendationFeedback, {
  foreignKey: 'userId',
  as: 'recommendationFeedbacks',
});
RecommendationFeedback.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User <-> UserAISettings (One-to-One)
User.hasOne(UserAISettings, {
  foreignKey: 'userId',
  as: 'aiSettings',
});
UserAISettings.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User <-> Conversation (One-to-Many)
User.hasMany(Conversation, {
  foreignKey: 'userId',
  as: 'conversations',
});
Conversation.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Conversation <-> Message (One-to-Many)
Conversation.hasMany(Message, {
  foreignKey: 'conversationId',
  as: 'messages',
  onDelete: 'CASCADE',
});
Message.belongsTo(Conversation, {
  foreignKey: 'conversationId',
  as: 'conversation',
});

export {
  User,
  Supplier,
  Card,
  CardCode,
  Order,
  Payment,
  Review,
  Seller,
  UserListing,
  Escrow,
  Dispute,
  Subscription,
  SubONEMembership,
  ShippingAddress,
  Shipment,
  UserProfile,
  UserBehavior,
  RecommendationFeedback,
  UserAISettings,
  Conversation,
  Message,
};
