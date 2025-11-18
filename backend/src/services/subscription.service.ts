import Subscription, { SubscriptionStatus, SubscriptionCycle, SubscriptionCategory } from '../models/Subscription';
import SubONEMembership, { MembershipTier } from '../models/SubONEMembership';
import User from '../models/User';
import Card from '../models/Card';
import Order from '../models/Order';
import { Op } from 'sequelize';

interface SavingsSuggestion {
  type: 'annual_plan' | 'family_plan' | 'subone' | 'bundle' | 'cancel_unused';
  title: string;
  description: string;
  currentCost: number;
  newCost: number;
  savings: number;
  savingsPercent: number;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

class SubscriptionService {
  // Create subscription from order
  async createSubscription(data: {
    userId: string;
    orderId?: string;
    cardId?: string;
    listingId?: string;
    name: string;
    category: SubscriptionCategory;
    provider: string;
    cycle: SubscriptionCycle;
    price: number;
    currency?: string;
    startDate: Date;
    endDate?: Date;
    autoRenew?: boolean;
  }) {
    const monthlyEquivalent = Subscription.calculateMonthlyEquivalent(data.price, data.cycle);
    const yearlyTotal = Subscription.calculateYearlyTotal(data.price, data.cycle);

    // Calculate next billing date
    let nextBillingDate: Date | undefined;
    if (data.cycle !== SubscriptionCycle.LIFETIME) {
      nextBillingDate = new Date(data.startDate);
      switch (data.cycle) {
        case SubscriptionCycle.MONTHLY:
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          break;
        case SubscriptionCycle.QUARTERLY:
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
          break;
        case SubscriptionCycle.YEARLY:
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          break;
      }
    }

    const subscription = await Subscription.create({
      userId: data.userId,
      orderId: data.orderId,
      cardId: data.cardId,
      listingId: data.listingId,
      name: data.name,
      category: data.category,
      provider: data.provider,
      status: SubscriptionStatus.ACTIVE,
      cycle: data.cycle,
      price: data.price,
      currency: data.currency || 'USD',
      startDate: data.startDate,
      endDate: data.endDate,
      nextBillingDate,
      autoRenew: data.autoRenew !== undefined ? data.autoRenew : true,
      renewalReminder: true,
      monthlyEquivalent,
      yearlyTotal,
    });

    // Analyze for savings opportunities
    await this.analyzeSavingsOpportunity(subscription.id);

    return subscription;
  }

  // Get user's subscriptions
  async getUserSubscriptions(userId: string, filters?: { status?: SubscriptionStatus; category?: SubscriptionCategory }) {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    const subscriptions = await Subscription.findAll({
      where,
      order: [['startDate', 'DESC']],
    });

    // Update statuses
    for (const sub of subscriptions) {
      await sub.updateStatus();
    }

    return subscriptions;
  }

  // Get subscription analytics
  async getSubscriptionAnalytics(userId: string) {
    const subscriptions = await Subscription.findAll({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });

    // Calculate totals
    const monthlyTotal = subscriptions.reduce((sum, sub) => sum + parseFloat(sub.monthlyEquivalent.toString()), 0);
    const yearlyTotal = subscriptions.reduce((sum, sub) => sum + parseFloat(sub.yearlyTotal.toString()), 0);

    // Group by category
    const byCategory: Record<string, { count: number; monthly: number; yearly: number }> = {};
    subscriptions.forEach((sub) => {
      if (!byCategory[sub.category]) {
        byCategory[sub.category] = { count: 0, monthly: 0, yearly: 0 };
      }
      byCategory[sub.category].count++;
      byCategory[sub.category].monthly += parseFloat(sub.monthlyEquivalent.toString());
      byCategory[sub.category].yearly += parseFloat(sub.yearlyTotal.toString());
    });

    // Find expiring soon
    const expiringSoon = subscriptions.filter((sub) => sub.isExpiringSoon());

    // Calculate potential savings
    const totalSavingsOpportunity = subscriptions.reduce(
      (sum, sub) => sum + parseFloat(sub.savingsOpportunity?.toString() || '0'),
      0
    );

    // Check SubONE eligibility
    const suboneMembership = await SubONEMembership.findOne({
      where: { userId, status: 'active' },
    });

    return {
      totalSubscriptions: subscriptions.length,
      monthlyTotal,
      yearlyTotal,
      byCategory,
      expiringSoon: expiringSoon.length,
      totalSavingsOpportunity,
      hasSubONE: !!suboneMembership,
      suboneMembership,
    };
  }

  // Analyze savings opportunity for a subscription
  async analyzeSavingsOpportunity(subscriptionId: string) {
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    let savingsOpportunity = 0;

    // Check if annual plan would be cheaper
    if (subscription.cycle === SubscriptionCycle.MONTHLY) {
      const monthlyYearlyCost = subscription.price * 12;
      const typicalAnnualDiscount = 0.15; // Assume 15% discount on annual plans
      const estimatedAnnualCost = monthlyYearlyCost * (1 - typicalAnnualDiscount);
      savingsOpportunity = monthlyYearlyCost - estimatedAnnualCost;
    }

    subscription.savingsOpportunity = savingsOpportunity;
    await subscription.save();

    return savingsOpportunity;
  }

  // Generate savings suggestions
  async getSavingsSuggestions(userId: string): Promise<SavingsSuggestion[]> {
    const suggestions: SavingsSuggestion[] = [];

    const subscriptions = await Subscription.findAll({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });

    const analytics = await this.getSubscriptionAnalytics(userId);

    // 1. Suggest annual plans for monthly subscriptions
    const monthlySubscriptions = subscriptions.filter(
      (sub) => sub.cycle === SubscriptionCycle.MONTHLY
    );

    for (const sub of monthlySubscriptions) {
      const monthlyCost = parseFloat(sub.price.toString());
      const yearlyCost = monthlyCost * 12;
      const annualPlanCost = yearlyCost * 0.85; // Assume 15% discount
      const savings = yearlyCost - annualPlanCost;

      if (savings > 10) {
        suggestions.push({
          type: 'annual_plan',
          title: `Switch ${sub.name} to Annual Plan`,
          description: `Save ${savings.toFixed(2)} per year by switching to an annual plan`,
          currentCost: yearlyCost,
          newCost: annualPlanCost,
          savings,
          savingsPercent: 15,
          action: 'Switch to annual billing',
          priority: savings > 50 ? 'high' : 'medium',
        });
      }
    }

    // 2. Suggest SubONE membership
    if (!analytics.hasSubONE) {
      const streamingServices = subscriptions.filter(
        (sub) =>
          sub.category === SubscriptionCategory.STREAMING ||
          sub.category === SubscriptionCategory.MUSIC
      );

      if (streamingServices.length >= 2) {
        const currentStreamingCost = streamingServices.reduce(
          (sum, sub) => sum + parseFloat(sub.monthlyEquivalent.toString()),
          0
        );

        // Suggest appropriate SubONE tier
        let recommendedTier: MembershipTier;
        let tierBenefits;

        if (streamingServices.length <= 3) {
          recommendedTier = MembershipTier.BASIC;
        } else if (streamingServices.length <= 5) {
          recommendedTier = MembershipTier.PREMIUM;
        } else {
          recommendedTier = MembershipTier.ULTIMATE;
        }

        tierBenefits = SubONEMembership.getTierBenefits(recommendedTier);
        const monthlySavings = currentStreamingCost - tierBenefits.price;

        if (monthlySavings > 0) {
          suggestions.push({
            type: 'subone',
            title: `Join SubONE ${recommendedTier.toUpperCase()} Family Plan`,
            description: `Bundle ${tierBenefits.servicesCount} streaming services and share with ${tierBenefits.familySlots} family members`,
            currentCost: currentStreamingCost * 12,
            newCost: tierBenefits.price * 12,
            savings: monthlySavings * 12,
            savingsPercent: Math.round((monthlySavings / currentStreamingCost) * 100),
            action: 'Upgrade to SubONE',
            priority: 'high',
          });
        }
      }
    }

    // 3. Identify potentially unused subscriptions
    const oldSubscriptions = subscriptions.filter((sub) => {
      const monthsSinceStart =
        (new Date().getTime() - new Date(sub.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsSinceStart > 3; // Active for more than 3 months
    });

    if (oldSubscriptions.length > 0) {
      for (const sub of oldSubscriptions.slice(0, 2)) {
        // Top 2
        suggestions.push({
          type: 'cancel_unused',
          title: `Review ${sub.name} Subscription`,
          description: `You've been subscribed for a while. Still using it?`,
          currentCost: parseFloat(sub.yearlyTotal.toString()),
          newCost: 0,
          savings: parseFloat(sub.yearlyTotal.toString()),
          savingsPercent: 100,
          action: 'Review usage',
          priority: 'low',
        });
      }
    }

    // 4. Suggest family sharing for eligible services
    const shareableServices = subscriptions.filter(
      (sub) =>
        sub.category === SubscriptionCategory.STREAMING ||
        sub.category === SubscriptionCategory.MUSIC ||
        sub.category === SubscriptionCategory.CLOUD
    );

    for (const sub of shareableServices) {
      if (!sub.sharedWith || sub.sharedWith === 0) {
        const monthlyCost = parseFloat(sub.monthlyEquivalent.toString());
        const familyPlanCost = monthlyCost * 1.5; // Assume family plan is 50% more
        const perPersonCost = familyPlanCost / 5; // Assume 5 people sharing
        const savings = (monthlyCost - perPersonCost) * 12;

        if (savings > 20) {
          suggestions.push({
            type: 'family_plan',
            title: `Share ${sub.name} with Family`,
            description: `Split a family plan with 4 others and save`,
            currentCost: monthlyCost * 12,
            newCost: perPersonCost * 12,
            savings,
            savingsPercent: Math.round((1 - perPersonCost / monthlyCost) * 100),
            action: 'Upgrade to family plan',
            priority: 'medium',
          });
        }
      }
    }

    // Sort by savings amount (highest first)
    suggestions.sort((a, b) => b.savings - a.savings);

    return suggestions;
  }

  // Update subscription
  async updateSubscription(subscriptionId: string, userId: string, data: Partial<Subscription>) {
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.userId !== userId) {
      throw new Error('Not authorized');
    }

    await subscription.update(data);
    return subscription;
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, userId: string) {
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.userId !== userId) {
      throw new Error('Not authorized');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.autoRenew = false;
    await subscription.save();

    return subscription;
  }

  // Get expiring subscriptions (for reminders)
  async getExpiringSubscriptions(days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const subscriptions = await Subscription.findAll({
      where: {
        status: SubscriptionStatus.ACTIVE,
        renewalReminder: true,
        nextBillingDate: {
          [Op.lte]: futureDate,
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'username'],
        },
      ],
    });

    return subscriptions;
  }

  // Delete subscription
  async deleteSubscription(subscriptionId: string, userId: string) {
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.userId !== userId) {
      throw new Error('Not authorized');
    }

    await subscription.destroy();
    return { success: true, message: 'Subscription deleted' };
  }
}

export default new SubscriptionService();
