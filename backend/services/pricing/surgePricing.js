/**
 * Module 3: Time-Based Surge Pricing
 */
const surgePricingModule = {
    name: 'surge-pricing',
    isEnabled: false, // Disabled: Preventing unwanted ₹200 "hidden" commissions/surges

    apply: async (context, breakdown) => {
        if (!surgePricingModule.isEnabled) return;

        const { schedule } = context;
        if (!schedule || !schedule.departureTime) return;

        // Calculate time left before departure
        // Assuming travelDate is YYYY-MM-DD and departureTime is HH:mm
        const now = new Date();
        const travelDateParts = context.travelDate.split('-');
        const [hour, minute] = schedule.departureTime.split(':');
        
        const departureDate = new Date(
            travelDateParts[0], 
            travelDateParts[1] - 1, 
            travelDateParts[2], 
            hour, 
            minute
        );

        const hoursUntilDeparture = (departureDate - now) / (1000 * 60 * 60);

        let surgePercentage = 0;

        // > 48 hrs -> normal
        // 24–48 hrs -> +10%
        // <24 hrs -> +25%
        if (hoursUntilDeparture < 24) {
            surgePercentage = 25;
        } else if (hoursUntilDeparture < 48) {
            surgePercentage = 10;
        }

        if (surgePercentage > 0) {
            const surgeAmount = Math.round((breakdown.baseFare * surgePercentage) / 100);
            breakdown.surgeAmount = surgeAmount;
            breakdown.appliedModules.push(`Time-Based Surge (+${surgePercentage}%)`);
        }
    }
};

module.exports = surgePricingModule;
