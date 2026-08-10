/**
 * Module 5: Competition-Based Pricing Engine
 */
const competitionPricingModule = {
    name: 'competition-pricing',
    isEnabled: true,

    apply: async (context, breakdown) => {
        if (!competitionPricingModule.isEnabled) return;

        const { routeId, currentOccupancy } = context;
        if (!routeId) return;

        // Simulating Competitor Analysis
        // 1. Fetch buses on same route (Simulated)
        const competitors = [
            { name: 'Bus A', occupancy: 70, price: 500 },
            { name: 'Bus B', occupancy: 30, price: 450 }
        ];

        const avgCompetitorOccupancy = competitors.reduce((acc, c) => acc + c.occupancy, 0) / competitors.length;

        // Logic:
        // If your bus occupancy < competitors -> reduce price (user discount)
        // If higher -> increase commission
        
        if (currentOccupancy < avgCompetitorOccupancy) {
            // Occupancy < competitors -> reduce price by 5%
            const discount = Math.round(breakdown.baseFare * 0.05);
            breakdown.userDiscount += discount;
            breakdown.appliedModules.push('Comp-Based Price Reduction');
        } else if (currentOccupancy > avgCompetitorOccupancy) {
            // Higher occupancy -> increase commission (This would be handled in commission logic)
            context.increaseCommission = true;
            breakdown.appliedModules.push('Comp-Based Comm Increase');
        }
    }
};

module.exports = competitionPricingModule;
