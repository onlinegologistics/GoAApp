/**
 * Module 9: Commission & GST Payout System
 * Bridges the new PricingEngine with the existing Commission Logic.
 */
const { calculateCommissionInternal } = require('../../controllers/commissionController');

const commissionSystemModule = {
    name: 'commission-system',
    isEnabled: true,

    apply: async (context, breakdown) => {
        if (!commissionSystemModule.isEnabled) return;

        const category = context.category || 'Bus';
        
        // Prepare parameters for the existing commission engine
        const params = {
            operatorId: context.operatorId,
            itemId: category === 'Hotel' ? context.hotelId : context.busId,
            seatType: context.seatType || 'All',
            busType: context.busType || 'All',
            sourceCity: context.sourceCity,
            destinationCity: context.destinationCity,
            timeSlot: context.timeSlot || 'All',
            ticketPrice: breakdown.baseFare,
            discountAmount: breakdown.couponDiscount || 0,
            distance: context.distance || 0,
            isWeekend: context.isWeekend,
            isFestival: context.isFestival,
            occupancy: context.currentOccupancy || 50,
            starRating: context.starRating || 0,
            category: category
        };

        // Call the existing logic (Requirement: Do NOT modify existing logic)
        const result = await calculateCommissionInternal(category, params);

        let finalCommission = result.commission;
        breakdown.matchedRuleId = result.matchedRuleId;

        // Module 4 & 5 Smart Logic:
        // Increase commission if occupancy > competitors
        if (context.increaseCommission) {
            finalCommission *= 1.1; // 10% boost
        }

        // Apply User-Type Rules (Module 4)
        if (context.userTypeRule) {
            const utRule = context.userTypeRule.commissionRules;
            if (utRule.commissionType === 'percentage') {
                // We use the same base or override?
                // Logic: Agent might get a specific percentage
                finalCommission = (breakdown.baseFare * utRule.value) / 100;
            } else {
                finalCommission = utRule.value;
            }
            // Enforce caps
            finalCommission = Math.max(utRule.minCap || 0, Math.min(utRule.maxCap || 999999, finalCommission));
        }

        // Module 6: Smart Coupon Logic
        // Rule: Prevent loss - ensure commission >= minimum cap
        // If commission on discounted fare is too low, we might need a floor.
        
        breakdown.commission = Math.round(finalCommission);

        // Apply GST (Module 9)
        // Store GST % in config or use 18% standard for commission
        const gstRate = 0.18; // Standard GST on service
        breakdown.gst = Math.round(breakdown.commission * gstRate);

        breakdown.appliedModules.push('Commission & GST System');
    }
};

module.exports = commissionSystemModule;
