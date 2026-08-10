/**
 * Module 2: Real-Time Occupancy Tracking
 */
const Booking = require('../../models/Booking');
const OccupancyLog = require('../../models/OccupancyLog');

const occupancyTrackingModule = {
    name: 'occupancy-tracking',
    isEnabled: true,

    apply: async (context, breakdown) => {
        if (!occupancyTrackingModule.isEnabled) return;

        const { busId, scheduleId, travelDate } = context;
        if (!busId || !scheduleId || !travelDate) return;

        // 1. Get total seats
        const totalSeats = context.bus?.totalSeats || 40;

        // 2. Count current bookings for this schedule & date
        const bookedCount = await Booking.countDocuments({
            bus: busId,
            schedule: scheduleId,
            travelDate: travelDate,
            paymentStatus: { $in: ['Completed', 'Confirmed'] }
        });

        const occupancy = (bookedCount / totalSeats) * 100;

        // 3. Update Occupancy Log (Upsert)
        await OccupancyLog.findOneAndUpdate(
            { busId, scheduleId, travelDate },
            { 
                totalSeats, 
                bookedSeats: bookedCount, 
                occupancyPercentage: occupancy,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );

        // 4. Dynamic Adjustment (Simplified - can be expanded)
        // If occupancy > 80% -> Increase commission/price by 10%
        if (occupancy > 80) {
            // We can adjust breakdown.surgeAmount or baseFare
            // For now, let's keep it informative or use a small multiplier
        }

        context.currentOccupancy = occupancy;
        breakdown.appliedModules.push('Occupancy Tracking');
    }
};

module.exports = occupancyTrackingModule;
