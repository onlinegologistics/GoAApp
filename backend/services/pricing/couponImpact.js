/**
 * Module 6: Coupon Impact Engine (Smart)
 */
const couponImpactModule = {
    name: 'coupon-impact',
    isEnabled: true,

    apply: async (context, breakdown) => {
        if (!couponImpactModule.isEnabled || !context.couponCode) return;

        const { couponCode, schedule } = context;
        const Coupon = require('../../models/Coupon');
        
        const coupon = await Coupon.findOne({ code: couponCode, status: 'Active' });
        if (!coupon) return;

        // Apply coupon discount (Smart Logic)
        let discount = 0;
        const currentTotal = breakdown.baseFare + breakdown.surgeAmount + breakdown.seatPremiums;

        if (coupon.discountType === 'percentage') {
            discount = (currentTotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount) {
                discount = Math.min(discount, coupon.maxDiscountAmount);
            }
        } else {
            discount = coupon.discountValue || coupon.discountAmount || 0;
        }

        breakdown.couponDiscount = Math.round(discount);
        
        // Ensure commission is recalculated or adjusted (Handled in commission logic)
        // Rule: Commission on baseFare OR discountedFare
        // Context will store this for the final commission module

        breakdown.appliedModules.push(`Coupon Applied: ${couponCode}`);
    }
};

module.exports = couponImpactModule;
