import { BaseAIAgent, AgentContext, AgentResponse } from './baseAgent.service';
import Subscription from '../../models/Subscription';
import { Order } from '../../models/Order';
import SubONEMembership from '../../models/SubONEMembership';
import { Op } from 'sequelize';

class BudgetPlannerAgent extends BaseAIAgent {
  constructor() {
    super(
      'Budget Planner Agent',
      'Smart budget planning assistant that helps you optimize spending, find savings, and manage subscription costs.',
      `You are a financial planning expert specialized in helping users manage their virtual product and subscription budgets.

Your expertise:
1. Analyze user spending patterns
2. Identify cost-saving opportunities
3. Recommend budget-friendly alternatives
4. Plan annual subscription costs
5. Suggest SubONE membership for savings
6. Create personalized budget plans
7. Track and forecast expenses

Guidelines:
- Be practical and realistic
- Focus on actionable savings
- Consider user's purchasing power
- Highlight subscription consolidation opportunities
- Recommend SubONE membership when it saves money
- Provide clear cost breakdowns
- Offer both short-term and long-term strategies

Key Platform Features:
- SubONE Membership: Family subscription service that saves money
  * Basic: $29.99/year (up to 3 members)
  * Premium: $49.99/year (up to 5 members)
  * Ultimate: $79.99/year (up to 8 members)
- Can save users 20-40% on subscription costs

Format response as JSON:
{
  "message": "personalized budget advice",
  "currentSpending": {
    "monthly": 0,
    "annual": 0,
    "breakdown": {"category": amount}
  },
  "savingsOpportunities": [
    {
      "type": "subscription_consolidation | subone_membership | category_switch | bulk_purchase",
      "title": "opportunity title",
      "description": "how to save",
      "potentialSavings": "amount or percentage",
      "action": "what to do"
    }
  ],
  "recommendedBudget": {
    "monthly": 0,
    "annual": 0,
    "breakdown": {"category": amount}
  },
  "actionPlan": ["step 1", "step 2", "step 3"]
}`
    );
  }

  async handle(userMessage: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Get user spending data
      const spendingData = context.userId
        ? await this.getUserSpendingData(context.userId)
        : null;

      // Build context-aware prompt
      let prompt = await this.buildPrompt(userMessage, context);

      // Add spending data context
      if (spendingData) {
        prompt += `\n\nUser Spending Data:\n${JSON.stringify(spendingData, null, 2)}`;
      }

      // Generate budget plan
      const response = await this.generate(prompt, {
        temperature: 0.6, // Lower temperature for more factual responses
        maxOutputTokens: 2048,
      });

      // Parse response
      const parsedResponse = this.parseJSON<any>(response);

      if (parsedResponse) {
        const actions = [];

        // Add SubONE membership action if recommended
        if (parsedResponse.savingsOpportunities?.some((op: any) =>
          op.type === 'subone_membership'
        )) {
          actions.push({
            type: 'view_subone',
            label: 'View SubONE Membership',
            data: { page: 'subone' },
          });
        }

        return {
          message: parsedResponse.message || response,
          data: {
            currentSpending: parsedResponse.currentSpending,
            savingsOpportunities: parsedResponse.savingsOpportunities || [],
            recommendedBudget: parsedResponse.recommendedBudget,
            actionPlan: parsedResponse.actionPlan || [],
          },
          suggestions: parsedResponse.actionPlan?.slice(0, 3) || [],
          actions: actions.length > 0 ? actions : undefined,
        };
      }

      return {
        message: response,
        suggestions: ['Show me savings opportunities', 'Create a monthly budget', 'Analyze my subscriptions'],
      };
    } catch (error: any) {
      console.error('Budget planner agent error:', error);
      return {
        message: 'I\'m having trouble analyzing your budget right now. Let me help you with general budgeting tips instead!',
        data: { error: error.message },
      };
    }
  }

  private async getUserSpendingData(userId: string): Promise<any> {
    try {
      // Get orders from last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const orders = await Order.findAll({
        where: {
          userId,
          status: 'completed',
          createdAt: { [Op.gte]: twelveMonthsAgo },
        },
      });

      // Get active subscriptions
      const subscriptions = await Subscription.findAll({
        where: {
          userId,
          status: { [Op.in]: ['active', 'trial'] },
        },
      });

      // Get SubONE membership
      const suboneMembership = await SubONEMembership.findOne({
        where: {
          userId,
          status: 'active',
        },
      });

      // Calculate spending
      const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      const monthlyAvg = totalSpent / 12;
      const annualSpent = totalSpent;

      // Calculate subscription costs
      const subscriptionCosts = subscriptions.reduce((sum, sub) => {
        const billingCycle = sub.billingCycle || 'monthly';
        const price = Number(sub.price);
        return sum + (billingCycle === 'monthly' ? price * 12 : billingCycle === 'yearly' ? price : price * 12);
      }, 0);

      // Category breakdown
      const categoryBreakdown: Record<string, number> = {};
      orders.forEach(order => {
        // This would need to be enhanced with actual category data
        const category = 'General';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Number(order.totalAmount);
      });

      return {
        totalOrders: orders.length,
        totalSpent: annualSpent,
        monthlyAverage: monthlyAvg,
        annualSubscriptionCosts: subscriptionCosts,
        activeSubscriptions: subscriptions.length,
        hasSubONE: !!suboneMembership,
        suboneTier: suboneMembership?.tier,
        categoryBreakdown,
      };
    } catch (error) {
      console.error('Error getting spending data:', error);
      return null;
    }
  }
}

export default new BudgetPlannerAgent();
