/**
 * Module 7: Boarding / Dropping Point Logic
 */
const BoardingPoint = require('../../models/BoardingPoint');

const boardingPointPricingModule = {
    name: 'boarding-point-pricing',
    isEnabled: true,

    apply: async (context, breakdown) => {
        if (!boardingPointPricingModule.isEnabled || !context.boardingPointId) return;

        const boardingPoint = await BoardingPoint.findById(context.boardingPointId);
        if (!boardingPoint) return;

        // Rules:
        // Premium -> +10
        // Normal -> no change
        // Remote -> -10
        let premium = 0;
        if (boardingPoint.type === 'Premium') {
            premium = 10;
        } else if (boardingPoint.type === 'Remote') {
            premium = -10;
        } else {
            premium = boardingPoint.premiumAmount || 0;
        }

        breakdown.boardingPremium = premium;
        breakdown.appliedModules.push(`Boarding: ${boardingPoint.name} (${boardingPoint.type})`);
    }
};

module.exports = boardingPointPricingModule;
