import nodemailer from 'nodemailer';
import { config } from '../config';
import logger from '../utils/logger';
import { User, Order, CardCode } from '../models';
import { decryptCard } from '../utils/encryption';

export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.password,
      },
    });
  }

  /**
   * Send email
   */
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
      });
      logger.info(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send SMS (using Twilio or similar service)
   */
  private async sendSMS(phone: string, message: string): Promise<void> {
    try {
      // Here you would integrate with Twilio or another SMS provider
      // For now, we'll just log it
      logger.info(`SMS to ${phone}: ${message}`);

      // Example Twilio integration:
      // const twilio = require('twilio');
      // const client = twilio(config.sms.twilio.accountSid, config.sms.twilio.authToken);
      // await client.messages.create({
      //   body: message,
      //   from: config.sms.twilio.phoneNumber,
      //   to: phone
      // });
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(user: User): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1890ff;">Welcome to CardSky! 🎉</h1>
        <p>Hello ${user.firstName || 'there'},</p>
        <p>Thank you for joining CardSky! We're excited to have you on board.</p>
        <p>With CardSky, you can:</p>
        <ul>
          <li>Browse thousands of digital cards</li>
          <li>Compare prices across multiple suppliers</li>
          <li>Get instant delivery via email or SMS</li>
          <li>Track your orders in real-time</li>
        </ul>
        <p>
          <a href="${config.corsOrigin}" style="background: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Start Shopping
          </a>
        </p>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The CardSky Team</p>
      </div>
    `;

    await this.sendEmail(user.email, 'Welcome to CardSky!', html);
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order: Order, user: User): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1890ff;">Order Confirmed! ✅</h1>
        <p>Hello ${user.firstName || 'there'},</p>
        <p>Your order has been confirmed and is being processed.</p>

        <div style="background: #f0f2f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3>Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Order Number:</strong></td>
              <td style="padding: 8px 0;">${order.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Quantity:</strong></td>
              <td style="padding: 8px 0;">${order.quantity}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Total Amount:</strong></td>
              <td style="padding: 8px 0; color: #f5222d; font-weight: bold;">$${order.finalAmount.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p>You will receive your card codes shortly after payment is confirmed.</p>

        <p>
          <a href="${config.corsOrigin}/orders/${order.id}" style="background: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Order
          </a>
        </p>

        <p>Thank you for shopping with CardSky!</p>
        <p>Best regards,<br>The CardSky Team</p>
      </div>
    `;

    await this.sendEmail(user.email, `Order Confirmation - ${order.orderNumber}`, html);
  }

  /**
   * Send card codes via email
   */
  async sendCardCodesEmail(order: Order, user: User, cardCodes: CardCode[]): Promise<void> {
    const decryptedCodes = cardCodes.map((code) => ({
      code: decryptCard(code.code),
      pin: code.pin ? decryptCard(code.pin) : null,
    }));

    const codesHtml = decryptedCodes
      .map(
        (code) => `
      <div style="background: #f0f2f5; padding: 12px; border-radius: 4px; margin: 8px 0;">
        <div style="font-size: 18px; font-weight: bold; font-family: monospace;">
          ${code.code}
        </div>
        ${code.pin ? `<div style="color: #666; margin-top: 4px;">PIN: ${code.pin}</div>` : ''}
      </div>
    `
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #52c41a;">Your Card Codes are Ready! 🎉</h1>
        <p>Hello ${user.firstName || 'there'},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been completed successfully!</p>

        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>⚠️ Important:</strong> Please keep these codes safe and do not share them with anyone.
        </div>

        <h3>Your Card Codes:</h3>
        ${codesHtml}

        <p style="margin-top: 24px;">
          <a href="${config.corsOrigin}/orders/${order.id}" style="background: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Full Order Details
          </a>
        </p>

        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Thank you for shopping with CardSky!</p>
        <p>Best regards,<br>The CardSky Team</p>
      </div>
    `;

    await this.sendEmail(user.email, `Your Card Codes - Order ${order.orderNumber}`, html);
  }

  /**
   * Send card codes via SMS
   */
  async sendCardCodesSMS(phone: string, order: Order, cardCodes: CardCode[]): Promise<void> {
    const decryptedCodes = cardCodes.map((code) => decryptCard(code.code));

    const message = `
CardSky - Your Order ${order.orderNumber}

Your card codes:
${decryptedCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

View full details: ${config.corsOrigin}/orders/${order.id}
    `.trim();

    await this.sendSMS(phone, message);
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(order: Order, user: User): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #52c41a;">Payment Confirmed! ✅</h1>
        <p>Hello ${user.firstName || 'there'},</p>
        <p>We've received your payment for order <strong>${order.orderNumber}</strong>.</p>

        <div style="background: #f0f2f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3>Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
              <td style="padding: 8px 0; color: #f5222d; font-weight: bold;">$${order.finalAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
              <td style="padding: 8px 0;">${order.paymentMethod?.toUpperCase()}</td>
            </tr>
          </table>
        </div>

        <p>Your order is now being processed and you will receive your card codes shortly.</p>

        <p>
          <a href="${config.corsOrigin}/orders/${order.id}" style="background: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Track Order
          </a>
        </p>

        <p>Thank you for your purchase!</p>
        <p>Best regards,<br>The CardSky Team</p>
      </div>
    `;

    await this.sendEmail(user.email, `Payment Confirmed - ${order.orderNumber}`, html);
  }

  /**
   * Send order cancellation notification
   */
  async sendOrderCancellation(order: Order, user: User): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f5222d;">Order Cancelled</h1>
        <p>Hello ${user.firstName || 'there'},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been cancelled.</p>

        <div style="background: #f0f2f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p>If you made a payment, it will be refunded to your original payment method within 5-7 business days.</p>
        </div>

        <p>If you didn't request this cancellation or have any questions, please contact our support team immediately.</p>

        <p>
          <a href="${config.corsOrigin}" style="background: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Continue Shopping
          </a>
        </p>

        <p>Best regards,<br>The CardSky Team</p>
      </div>
    `;

    await this.sendEmail(user.email, `Order Cancelled - ${order.orderNumber}`, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user: User, resetToken: string): Promise<void> {
    const resetUrl = `${config.corsOrigin}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1890ff;">Password Reset Request</h1>
        <p>Hello ${user.firstName || 'there'},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>

        <p>
          <a href="${resetUrl}" style="background: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </p>

        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>

        <p>Best regards,<br>The CardSky Team</p>
      </div>
    `;

    await this.sendEmail(user.email, 'Reset Your Password - CardSky', html);
  }

  /**
   * Send low stock alert to supplier
   */
  async sendLowStockAlert(supplierEmail: string, cardName: string, stock: number): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #fa8c16;">⚠️ Low Stock Alert</h1>
        <p>Hello,</p>
        <p>The following card is running low on stock:</p>

        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3>${cardName}</h3>
          <p style="font-size: 18px; color: #f5222d;"><strong>Current Stock: ${stock}</strong></p>
        </div>

        <p>Please replenish your inventory to avoid stock-outs.</p>

        <p>
          <a href="${config.corsOrigin}/dashboard" style="background: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Manage Inventory
          </a>
        </p>

        <p>Best regards,<br>The CardSky Team</p>
      </div>
    `;

    await this.sendEmail(supplierEmail, `Low Stock Alert - ${cardName}`, html);
  }
}

export default new NotificationService();
