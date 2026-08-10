const cron = require('node-cron');
const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');

/**
 * Run every 5 minutes to check for upcoming trips and send reminders
 */
const initReminderCron = () => {
    cron.schedule('*/5 * * * *', async () => {
        console.log('[CRON] Checking for pending boarding reminders...');
        try {
            const now = new Date();
            const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

            // Find all confirmed bookings that haven't been notified
            // Note: This logic assumes travelDate is searchable and departureTime is comparable
            const pendingBookings = await Booking.find({
                status: 'Confirmed',
                notificationSent: false
            }).populate({
                path: 'schedule',
                populate: { path: 'bus route' }
            });

            for (const booking of pendingBookings) {
                const schedule = booking.schedule;
                if (!schedule) continue;

                // Simple time check logic
                // In production, you'd combine travelDate + departureTime into a full Date object
                const [hour, minute] = schedule.departureTime.split(':').map(Number);
                const tripDate = new Date(booking.travelDate);
                tripDate.setHours(hour, minute, 0, 0);

                const diffInMinutes = (tripDate - now) / (1000 * 60);

                // If trip is within 120 minutes (2 hours) and hasn't started yet
                if (diffInMinutes > 0 && diffInMinutes <= 120) {
                    console.log(`[CRON] Sending auto-reminder for PNR: ${booking.pnrNumber}`);
                    
                    const passengers = booking.passengers || [{ name: booking.passengerName }];
                    for (const p of passengers) {
                        const boardingPt = p.boardingPoint || booking.boarding?.point || booking.boardingPoint;

                        const message = `
Dear ${p.name},

BOARDING REMINDER!
Your ${schedule.bus?.busName || 'GoAirClass'} bus departs in 2 hours.
Time: ${schedule.departureTime}
PNR: ${booking.pnrNumber}
Pickup: ${boardingPt}

Driver: ${schedule.driverName || 'Updating...'} (${schedule.driverPhone || 'N/A'})

Please reach the pickup point early.
`;
                        // PLACEHOLDER: SMS API Integration
                        console.log(`[AUTO-CRON] SENT TO: ${booking.passengerMobile} | PNR: ${booking.pnrNumber}`);
                    }

                    booking.notificationSent = true;
                    await booking.save();
                }
            }
        } catch (error) {
            console.error('[CRON ERROR] Boarding Reminders:', error);
        }
    });
};

module.exports = { initReminderCron };
