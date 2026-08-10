const Booking = require('../models/Booking');
const Bus = require('../models/Bus');
const Schedule = require('../models/Schedule');

/**
 * Get all live/upcoming bookings for the operator
 */
const getLiveBookings = async (req, res) => {
    try {
        const operatorId = req.user.id; // From authMiddleware (Operator ID)

        // Find all buses for this operator
        const buses = await Bus.find({ operator: operatorId });
        const busIds = buses.map(bus => bus._id);

        // Find bookings for these buses
        // We populate bus, route and schedule for details
        const bookings = await Booking.find({ bus: { $in: busIds } })
            .populate('bus')
            .populate('route')
            .populate('schedule')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error("Get Live Bookings Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * Update boarding status
 */
const updateBoardingStatus = async (req, res) => {
    try {
        const { bookingId, boardingStatus, operatorNotes } = req.body;
        const operatorId = req.user.id;

        const booking = await Booking.findById(bookingId).populate('bus');
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        // Prevent duplicate status updates
        if (booking.boardingStatus === boardingStatus) {
            return res.status(400).json({ success: false, message: `Passenger is already marked as ${boardingStatus}` });
        }

        // Security check: Ensure this booking belongs to this operator
        if (booking.bus.operator.toString() !== operatorId) {
            return res.status(403).json({ success: false, message: "Unauthorized access to this booking" });
        }

        if (boardingStatus) booking.boardingStatus = boardingStatus;
        if (operatorNotes !== undefined) booking.operatorNotes = operatorNotes;

        await booking.save();

        res.status(200).json({ success: true, message: "Status updated successfully", booking });
    } catch (error) {
        console.error("Update Boarding Status Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * Change seat assignment
 */
const changeSeat = async (req, res) => {
    try {
        const { bookingId, newSeatNumbers } = req.body;
        const operatorId = req.user.id;

        const booking = await Booking.findById(bookingId).populate('bus');
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (booking.bus.operator.toString() !== operatorId) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        // Logic to check seat availability could be added here
        // For now, we update the seats
        booking.seatNumbers = newSeatNumbers;
        await booking.save();

        res.status(200).json({ success: true, message: "Seats updated successfully", booking });
    } catch (error) {
        console.error("Change Seat Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * Cancel booking by operator
 */
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const operatorId = req.user.id;

        const booking = await Booking.findById(bookingId).populate('bus');
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        if (booking.bus.operator.toString() !== operatorId) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        booking.status = 'Cancelled';
        booking.paymentStatus = 'Cancelled';
        await booking.save();

        res.status(200).json({ success: true, message: "Booking cancelled successfully" });
    } catch (error) {
        console.error("Cancel Booking Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * Update driver and pickup details for a trip
 */
const updateTripDriverDetails = async (req, res) => {
    try {
        const { tripId, driverName, driverPhone, pickupContactName, pickupContactPhone } = req.body;
        const operatorId = req.user.id;

        const schedule = await Schedule.findById(tripId);
        if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found" });

        if (schedule.operator.toString() !== operatorId) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        schedule.driverName = driverName || '';
        schedule.driverPhone = driverPhone || '';
        schedule.pickupContactName = pickupContactName || '';
        schedule.pickupContactPhone = pickupContactPhone || '';
        
        await schedule.save();

        res.status(200).json({ success: true, message: "Driver details updated", schedule });
    } catch (error) {
        console.error("Update Driver Details Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * Get Passenger Manifest for a specific schedule
 * GET /api/bus-operator/trips/:scheduleId/manifest
 */
const getManifestBySchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const operatorId = req.user.id;

        const schedule = await Schedule.findById(scheduleId).populate('bus');
        if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found" });

        if (schedule.operator.toString() !== operatorId) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        // Find all confirmed or pending bookings for this schedule
        const bookings = await Booking.find({
            schedule: scheduleId,
            status: { $in: ['Confirmed', 'Pending'] }
        }).sort({ seatNumber: 1 });

        // Flatten passengers into a manifest list
        const manifest = [];
        bookings.forEach(booking => {
            if (booking.passengers && booking.passengers.length > 0) {
                booking.passengers.forEach(p => {
                    manifest.push({
                        bookingId: booking._id,
                        pnr: booking.pnrNumber,
                        name: p.name,
                        seat: p.seatNumber,
                        // Fallback to booking-level boarding point if per-passenger is missing
                        boardingPoint: p.boardingPoint || booking.boarding?.point || booking.boardingPoint,
                        phone: booking.passengerMobile || booking.contactDetails?.phone || 'N/A',
                        status: booking.notificationSent ? 'Sent' : 'Pending'
                    });
                });
            } else {
                // Fallback for bookings without passengers array (legacy or single)
                manifest.push({
                    bookingId: booking._id,
                    pnr: booking.pnrNumber,
                    name: booking.passengerName,
                    seat: booking.seatNumber || booking.seatNumbers?.[0],
                    boardingPoint: booking.boarding?.point || booking.boardingPoint,
                    phone: booking.passengerMobile || booking.contactDetails?.phone || 'N/A',
                    status: booking.notificationSent ? 'Sent' : 'Pending'
                });
            }
        });

        res.status(200).json({ 
            success: true, 
            manifest,
            totalPassengers: manifest.length,
            tripDetails: {
                busName: schedule.bus?.busName,
                busNumber: schedule.bus?.busNumber,
                departureTime: schedule.departureTime
            }
        });
    } catch (error) {
        console.error("Get Manifest Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * Send boarding reminders for a trip manually
 */
const sendBoardingReminders = async (req, res) => {
    try {
        const { tripId } = req.body;
        const operatorId = req.user.id;

        const schedule = await Schedule.findById(tripId).populate('bus route');
        if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found" });

        if (schedule.operator.toString() !== operatorId) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        // Find confirmed or pending bookings for this schedule
        const bookings = await Booking.find({
            schedule: tripId,
            status: { $in: ['Confirmed', 'Pending'] }
        });

        if (bookings.length === 0) {
            return res.status(400).json({ success: false, message: "No confirmed bookings found for this trip" });
        }

        const sentList = [];
        for (const booking of bookings) {
            const passengers = booking.passengers || [{ name: booking.passengerName }];
            
            for (const p of passengers) {
                const boardingPt = p.boardingPoint || booking.boarding?.point || booking.boardingPoint;
                
                const message = `
Dear ${p.name},

Greetings from ${schedule.bus?.busName || 'GoAirClass'}!

Your bus is scheduled to depart soon.
Bus No: ${schedule.bus?.busNumber || 'N/A'}
Route: ${schedule.route?.fromCity} -> ${schedule.route?.toCity}
PNR: ${booking.pnrNumber}

Pickup Point: ${boardingPt}
Pickup Contact: ${schedule.pickupContactName} (${schedule.pickupContactPhone})

Driver Info:
${schedule.driverName} (${schedule.driverPhone})

Please reach the boarding point 15 mins before departure.
Have a safe journey!
`;
                // PLACEHOLDER: Integration with SMS API (e.g. Twilio, Fast2SMS)
                console.log(`[BOARDING REMINDER] TO: ${booking.passengerMobile} | PNR: ${booking.pnrNumber} | MSG: ${message}`);
            }
            
            booking.notificationSent = true;
            await booking.save();
            sentList.push(booking.pnrNumber);
        }

        schedule.reminderSent = true;
        await schedule.save();

        res.status(200).json({ 
            success: true, 
            message: `Reminders dispatched to ${bookings.length} bookings.`,
            sentPnrs: sentList
        });
    } catch (error) {
        console.error("Send Boarding Reminders Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    getLiveBookings,
    updateBoardingStatus,
    changeSeat,
    cancelBooking,
    updateTripDriverDetails,
    sendBoardingReminders,
    getManifestBySchedule
};
