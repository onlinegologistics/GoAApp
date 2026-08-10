/**
 * Module 4: User Type Based Pricing
 */
const UserType = require('../../models/UserType');

const userTypePricingModule = {
    name: 'user-type-pricing',
    isEnabled: true,

    apply: async (context, breakdown) => {
        if (!userTypePricingModule.isEnabled) return;

        const { userRole } = context; // Expected 'B2C', 'Agent', or 'Corporate'
        if (!userRole) return;

        const rule = await UserType.findOne({ role: userRole, isActive: true });
        if (!rule) return;

        // 1. Discount Multiplier (e.g. Corporate gets -10%)
        if (rule.commissionRules.discountMultiplier < 1) {
            const discount = Math.round(breakdown.baseFare * (1 - rule.commissionRules.discountMultiplier));
            breakdown.userDiscount = discount;
        }

        // 2. Adjust Commission Based on User Role
        // This will be used in the final commission calculation later or here
        context.userTypeRule = rule;
        
        breakdown.appliedModules.push(`User Type: ${userRole}`);
    }
};

module.exports = userTypePricingModule;
