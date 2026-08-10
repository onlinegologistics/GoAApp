/**
 * Module 8: Cancellation & Refund Commission System
 */
const CancellationLog = require('../../models/CancellationLog');
const Booking = require('../../models/Booking');

const cancellationSystemModule = {
    name: 'cancellation-system',
    isEnabled: true,

    /**
     * This module might be called during the cancellation process rather than the search/pricing.
     * We'll provide a helper method to be called from the cancellation route.
     */
    processCancellation: async (bookingId, reversalAmount) => {
        const booking = await Booking.findById(bookingId);
        if (!booking) return;

        // Log the reversal
        const log = new CancellationLog({
            bookingId: booking._id,
            pnrNumber: booking.pnrNumber,
            userId: booking.userId,
            originalTotalFare: booking.totalFare,
            refundAmount: reversalAmount, // Amount refunded to user
            cancellationCharges: booking.totalFare - reversalAmount,
            reversedCommission: booking.commission, // Reverse full or partial commission
            cancellationDate: new Date()
        });

        await log.save();
    },

    apply: async (context, breakdown) => {
        // No-op during search/booking pricing
    }
};

module.exports = cancellationSystemModule;
