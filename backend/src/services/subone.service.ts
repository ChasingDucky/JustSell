import SubONEMembership, { MembershipTier, MembershipStatus } from '../models/SubONEMembership';
import User from '../models/User';
import { Op } from 'sequelize';

class SubONEService {
  // Create SubONE membership
  async createMembership(data: {
    userId: string;
    tier: MembershipTier;
    duration?: number; // months
  }) {
    // Check if user already has active membership
    const existing = await SubONEMembership.findOne({
      where: {
        userId: data.userId,
        status: { [Op.in]: [MembershipStatus.ACTIVE, MembershipStatus.TRIAL] },
      },
    });

    if (existing) {
      throw new Error('User already has an active SubONE membership');
    }

    const tierBenefits = SubONEMembership.getTierBenefits(data.tier);
    const duration = data.duration || 12; // Default 12 months

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration);

    const membership = await SubONEMembership.create({
      userId: data.userId,
      tier: data.tier,
      status: MembershipStatus.TRIAL, // Start with trial
      price: tierBenefits.price,
      currency: 'USD',
      startDate,
      endDate,
      autoRenew: true,
      familySlots: tierBenefits.familySlots,
      usedSlots: 1,
      includedServices: tierBenefits.services,
      monthlyBenefit: tierBenefits.estimatedMonthlySavings,
      yearlyBenefit: tierBenefits.estimatedYearlySavings,
      servicesCount: tierBenefits.servicesCount,
    });

    return membership;
  }

  // Get user's membership
  async getUserMembership(userId: string) {
    const membership = await SubONEMembership.findOne({
      where: {
        userId,
        status: { [Op.in]: [MembershipStatus.ACTIVE, MembershipStatus.TRIAL] },
      },
    });

    return membership;
  }

  // Upgrade membership tier
  async upgradeMembership(userId: string, newTier: MembershipTier) {
    const membership = await this.getUserMembership(userId);

    if (!membership) {
      throw new Error('No active membership found');
    }

    // Check if upgrade is valid
    const tiers = [MembershipTier.BASIC, MembershipTier.PREMIUM, MembershipTier.ULTIMATE];
    const currentIndex = tiers.indexOf(membership.tier);
    const newIndex = tiers.indexOf(newTier);

    if (newIndex <= currentIndex) {
      throw new Error('Can only upgrade to higher tier');
    }

    const tierBenefits = SubONEMembership.getTierBenefits(newTier);

    await membership.update({
      tier: newTier,
      price: tierBenefits.price,
      familySlots: tierBenefits.familySlots,
      includedServices: tierBenefits.services,
      monthlyBenefit: tierBenefits.estimatedMonthlySavings,
      yearlyBenefit: tierBenefits.estimatedYearlySavings,
      servicesCount: tierBenefits.servicesCount,
    });

    return membership;
  }

  // Add family member
  async addFamilyMember(userId: string, memberEmail: string) {
    const membership = await this.getUserMembership(userId);

    if (!membership) {
      throw new Error('No active membership found');
    }

    if (!membership.canAddMember()) {
      throw new Error('No available family slots');
    }

    // Find the family member user
    const memberUser = await User.findOne({ where: { email: memberEmail } });
    if (!memberUser) {
      throw new Error('User not found');
    }

    // Check if member already has SubONE
    const memberHasSubONE = await this.getUserMembership(memberUser.id);
    if (memberHasSubONE) {
      throw new Error('User already has SubONE membership');
    }

    membership.usedSlots += 1;
    membership.metadata = {
      ...membership.metadata,
      familyMembers: [
        ...(membership.metadata?.familyMembers || []),
        {
          userId: memberUser.id,
          email: memberEmail,
          addedAt: new Date(),
        },
      ],
    };

    await membership.save();
    return membership;
  }

  // Remove family member
  async removeFamilyMember(userId: string, memberUserId: string) {
    const membership = await this.getUserMembership(userId);

    if (!membership) {
      throw new Error('No active membership found');
    }

    const familyMembers = membership.metadata?.familyMembers || [];
    const memberIndex = familyMembers.findIndex((m: any) => m.userId === memberUserId);

    if (memberIndex === -1) {
      throw new Error('Family member not found');
    }

    familyMembers.splice(memberIndex, 1);
    membership.usedSlots -= 1;
    membership.metadata = {
      ...membership.metadata,
      familyMembers,
    };

    await membership.save();
    return membership;
  }

  // Calculate savings for user
  async calculateUserSavings(userId: string, currentSubscriptionsCost: number) {
    // Get recommended tier based on subscription cost
    let recommendedTier: MembershipTier;

    if (currentSubscriptionsCost < 40) {
      recommendedTier = MembershipTier.BASIC;
    } else if (currentSubscriptionsCost < 70) {
      recommendedTier = MembershipTier.PREMIUM;
    } else {
      recommendedTier = MembershipTier.ULTIMATE;
    }

    const tierBenefits = SubONEMembership.getTierBenefits(recommendedTier);

    const monthlySavings = currentSubscriptionsCost - tierBenefits.price;
    const yearlySavings = monthlySavings * 12;

    // If sharing with family, calculate per-person cost
    const perPersonCost = tierBenefits.price / tierBenefits.familySlots;
    const maxSavingsPerPerson = currentSubscriptionsCost - perPersonCost;
    const maxYearlySavingsPerPerson = maxSavingsPerPerson * 12;

    return {
      recommendedTier,
      tierPrice: tierBenefits.price,
      currentCost: currentSubscriptionsCost,
      monthlySavings: Math.max(0, monthlySavings),
      yearlySavings: Math.max(0, yearlySavings),
      perPersonCost,
      maxSavingsPerPerson: Math.max(0, maxSavingsPerPerson),
      maxYearlySavingsPerPerson: Math.max(0, maxYearlySavingsPerPerson),
      servicesIncluded: tierBenefits.services,
      familySlots: tierBenefits.familySlots,
    };
  }

  // Cancel membership
  async cancelMembership(userId: string, reason?: string) {
    const membership = await this.getUserMembership(userId);

    if (!membership) {
      throw new Error('No active membership found');
    }

    membership.status = MembershipStatus.CANCELLED;
    membership.autoRenew = false;
    membership.metadata = {
      ...membership.metadata,
      cancellationReason: reason,
      cancelledAt: new Date(),
    };

    await membership.save();
    return membership;
  }

  // Reactivate membership
  async reactivateMembership(userId: string) {
    const membership = await SubONEMembership.findOne({
      where: { userId, status: MembershipStatus.CANCELLED },
    });

    if (!membership) {
      throw new Error('No cancelled membership found');
    }

    // Check if expired
    if (new Date(membership.endDate) < new Date()) {
      // Extend by 1 month
      membership.endDate = new Date();
      membership.endDate.setMonth(membership.endDate.getMonth() + 1);
    }

    membership.status = MembershipStatus.ACTIVE;
    membership.autoRenew = true;

    await membership.save();
    return membership;
  }

  // Get all tier plans (for comparison)
  getTierComparison() {
    return [
      {
        tier: MembershipTier.BASIC,
        ...SubONEMembership.getTierBenefits(MembershipTier.BASIC),
        features: [
          '3 Family Member Slots',
          '3 Premium Streaming Services',
          'Save $240/year',
          'Cancel Anytime',
        ],
      },
      {
        tier: MembershipTier.PREMIUM,
        ...SubONEMembership.getTierBenefits(MembershipTier.PREMIUM),
        features: [
          '5 Family Member Slots',
          '5 Premium Streaming Services',
          'Save $480/year',
          'Priority Support',
          'Cancel Anytime',
        ],
        popular: true,
      },
      {
        tier: MembershipTier.ULTIMATE,
        ...SubONEMembership.getTierBenefits(MembershipTier.ULTIMATE),
        features: [
          '8 Family Member Slots',
          '8 Premium Streaming Services',
          'Save $840/year',
          'Priority Support',
          'Exclusive Deals',
          'Cancel Anytime',
        ],
      },
    ];
  }

  // Activate trial (convert from trial to active)
  async activateTrial(userId: string) {
    const membership = await SubONEMembership.findOne({
      where: { userId, status: MembershipStatus.TRIAL },
    });

    if (!membership) {
      throw new Error('No trial membership found');
    }

    membership.status = MembershipStatus.ACTIVE;
    await membership.save();

    return membership;
  }
}

export default new SubONEService();
