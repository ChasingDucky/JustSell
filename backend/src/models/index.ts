import { User } from './User';
import { Supplier } from './Supplier';
import { Card } from './Card';
import { CardCode } from './CardCode';
import { Order } from './Order';
import { Payment } from './Payment';

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

export {
  User,
  Supplier,
  Card,
  CardCode,
  Order,
  Payment,
};
