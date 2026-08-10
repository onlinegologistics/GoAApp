/**
 * Module 1: Seat-Level Pricing Engine
 * Applies premiums based on seat type/location.
 */
const Seat = require('../../models/Seat');

const seatPricingModule = {
    name: 'seat-pricing',
    isEnabled: true,

    apply: async (context, breakdown) => {
        if (!seatPricingModule.isEnabled) return;

        const { selectedSeats, busId } = context;
        if (!selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) return;

        let totalSeatPremium = 0;

        for (const seatNo of selectedSeats) {
            // 1. Fetch from DB if configured
            const seatConfig = await Seat.findOne({ busId, seatNumber: seatNo });
            
            if (seatConfig) {
                totalSeatPremium += (seatConfig.seatPremiumAmount || 0);
            } else {
                // 2. Default Rules if not in DB
                // Window seat -> +20
                // Sleeper -> +50
                // Back seats -> -10 (Assuming some naming convention or layout logic)
                
                // Logic based on seat number or type if available in context
                const seatDetail = (context.bus?.seatLayout || []).find(s => s.seatNo === seatNo);
                
                if (seatDetail) {
                    if (seatDetail.type?.includes('sleeper')) {
                        totalSeatPremium += 50;
                    }
                    
                    // Simple heuristic for window seats (usually 'W' or specific numbers)
                    // Or check if it's a window seat based on layout if available
                    if (seatNo.includes('W')) { // Example convention
                        totalSeatPremium += 20;
                    }
                }
            }
        }

        breakdown.seatPremiums = totalSeatPremium;
        breakdown.appliedModules.push('Seat-Level Pricing');
    }
};

module.exports = seatPricingModule;
