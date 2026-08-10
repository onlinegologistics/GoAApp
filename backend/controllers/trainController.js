const Train = require('../models/train/Train');
const Station = require('../models/train/Station');
const TrainBooking = require('../models/train/TrainBooking');
const TrainRoute = require('../models/train/TrainRoute');
const Coach = require('../models/train/Coach');
const SeatAvailability = require('../models/train/SeatAvailability');
const FareRule = require('../models/train/FareRule');
const TrainPricing = require('../models/train/TrainPricing');
const TrainCoach = require('../models/train/TrainCoach');
const SeatInventory = require('../models/train/SeatInventory');
const CoachType = require('../models/train/CoachType');
const TrainSeat = require('../models/train/Seat');
const TrainPayment = require('../models/train/Payment');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { generateTicketHTML } = require('../utils/ticketTemplate');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper to generate PNR
const generatePNR = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

exports.getAllTrains = async (req, res) => {
    try {
        const trains = await Train.find().populate('source destination');
        res.status(200).json({ success: true, trains });
    } catch (error) {
        console.error('Error in getAllTrains:', error);
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
};

exports.createTrain = async (req, res) => {
    try {
        const train = await Train.create(req.body);
        res.status(201).json({ success: true, train });
    } catch (error) {
        console.error('Error in createTrain:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ success: false, message: `A train with this ${field} already exists.` });
        }
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
};

exports.updateTrain = async (req, res) => {
    try {
        const train = await Train.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
        res.status(200).json({ success: true, train });
    } catch (error) {
        console.error('Error in updateTrain:', error);
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
};

exports.deleteTrain = async (req, res) => {
    try {
        const train = await Train.findByIdAndDelete(req.params.id);
        if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
        res.status(200).json({ success: true, message: 'Train deleted successfully' });
    } catch (error) {
        console.error('Error in deleteTrain:', error);
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await TrainBooking.find().populate('train source destination').sort({ createdAt: -1 });
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error('Error in getAllBookings:', error);
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
};

exports.saveCoachConfig = async (req, res) => {
    try {
        const trainId = req.body.trainId || '000000000000000000000000';
        const coaches = req.body.coaches || [];

        await Coach.deleteMany({ train: trainId });
        const coachDocs = coaches.map(c => ({
            train: trainId,
            coachType: c.type.split(' ')[0], // '1A (First AC)' -> '1A'
            prefix: c.prefix,
            numberOfCoaches: c.count,
            seatsPerCoach: c.seats,
            totalSeats: c.count * c.seats
        }));
        await Coach.insertMany(coachDocs);
        res.status(200).json({ success: true, message: 'Coach configuration saved successfully' });
    } catch (error) {
        console.error('Error in saveCoachConfig:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCoachConfig = async (req, res) => {
    try {
        const trainId = req.params.trainId || '000000000000000000000000';
        const coaches = await Coach.find({ train: trainId });
        res.status(200).json({ success: true, coaches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.saveFareRules = async (req, res) => {
    try {
        const trainId = req.body.trainId || '000000000000000000000000';
        const fares = req.body.fares || [];
        const baseFarePerKm = req.body.baseFarePerKm || 2.0;

        // 1. Update/Save Base Pricing (TrainPricing)
        let pricing = await TrainPricing.findOne({ train_id: trainId });
        if (pricing) {
            pricing.baseFarePerKm = baseFarePerKm;
            await pricing.save();
        } else {
            await TrainPricing.create({ train_id: trainId, baseFarePerKm });
        }

        // 2. Update/Save Class Fares (FareRule)
        await FareRule.deleteMany({ train: trainId });
        const fareDocs = fares.map(f => ({
            train: trainId,
            classType: f.class.split(' ')[0],
            baseFare: f.baseFare || 0,
            multiplier: f.multiplier || 1.0,
            tatkalCharge: f.tatkal || 0,
            dynamicPricing: f.dynamic || 'None'
        }));
        await FareRule.insertMany(fareDocs);

        res.status(200).json({ success: true, message: 'Fare rules and base pricing saved successfully' });
    } catch (error) {
        console.error('Error in saveFareRules:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getFareRules = async (req, res) => {
    try {
        const trainId = req.params.trainId || '000000000000000000000000';
        const [fares, pricing] = await Promise.all([
            FareRule.find({ train: trainId }),
            TrainPricing.findOne({ train_id: trainId })
        ]);

        res.status(200).json({
            success: true,
            fares,
            baseFarePerKm: pricing ? pricing.baseFarePerKm : 2.0
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.bookTrain = async (req, res) => {
    try {
        const { trainId, journeyDate, sourceId, destinationId, passengers, irctcUserId, contactDetails, addOns, totalFare, coachType: selectedCoachType } = req.body;

        console.log('Booking Request received:', { trainId, journeyDate, sourceId, destinationId, coachType: selectedCoachType });

        if (!trainId || !sourceId || !destinationId) {
            return res.status(400).json({ success: false, message: 'Missing required IDs (trainId, sourceId, or destinationId)' });
        }

        // Verify train
        const train = await Train.findById(trainId).catch(err => {
            console.error('Invalid Train ID format:', trainId);
            throw new Error(`Invalid Train ID: ${trainId}`);
        });
        if (!train) return res.status(404).json({ success: false, message: 'Train not found' });

        // Identify CoachType record by name (e.g., 'SL', '3A')
        const coachTypeRecord = await CoachType.findOne({ name: selectedCoachType });
        if (!coachTypeRecord) return res.status(400).json({ success: false, message: `Invalid coach type: ${selectedCoachType}` });

        // Check and decrement seat availability in TrainSeatInventory
        const count = passengers.length;

        // Try date-specific first, then base (date=null)
        let inv;
        try {
            inv = await SeatInventory.findOneAndUpdate(
                { trainId, coachTypeId: coachTypeRecord._id, date: journeyDate, availableSeats: { $gte: count } },
                { $inc: { availableSeats: -count } },
                { new: true }
            );

            if (!inv) {
                // Fallback to base (date=null)
                inv = await SeatInventory.findOneAndUpdate(
                    { trainId, coachTypeId: coachTypeRecord._id, date: null, availableSeats: { $gte: count } },
                    { $inc: { availableSeats: -count } },
                    { new: true }
                );
            }
        } catch (invErr) {
            console.error('Inventory Update Error:', invErr);
            throw new Error('Failed to update seat inventory');
        }

        if (!inv) {
            return res.status(400).json({ success: false, message: `Not enough seats available in ${selectedCoachType}` });
        }

        const bookingData = {
            pnr: generatePNR(),
            train: trainId,
            journeyDate,
            source: sourceId,
            destination: destinationId,
            passengers: passengers.map(p => ({ ...p, coachType: selectedCoachType })),
            irctcUserId,
            contactDetails,
            addOns,
            customerName: contactDetails?.name || passengers[0]?.name || 'Guest',
            totalFare,
            status: 'CONFIRMED'
        };

        const booking = await TrainBooking.create(bookingData).catch(err => {
            console.error('Mongoose Validation/Create Error:', err);
            throw err;
        });

        res.status(201).json({ success: true, booking });
    } catch (error) {
        console.error('Error in bookTrain:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            details: error.name === 'ValidationError' ? error.errors : null
        });
    }
};

exports.lockSeats = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { trainId, coachType, journeyDate, passengers, userId, sourceId, destinationId, contactDetails, irctcUserId, totalFare } = req.body;
        const passengerCount = passengers?.length || 0;

        // ─── Basic validation ───────────────────────────────────────────────
        if (!trainId || !coachType || !journeyDate || !passengers || passengerCount === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Missing required fields: trainId, coachType, journeyDate, or passengers' });
        }

        // ─── Validate trainId is a legal ObjectId before querying ──────────
        if (!mongoose.Types.ObjectId.isValid(trainId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: `Invalid trainId: "${trainId}"` });
        }

        // --- Robust Date Formatting (Sync with search) ---
        let formattedDate = journeyDate;
        if (journeyDate && journeyDate.includes('-')) {
            const parts = journeyDate.split('-');
            if (parts[0].length !== 4) {
                // DD-MM-YYYY -> YYYY-MM-DD
                const [d, m, y] = parts;
                formattedDate = `${y}-${m}-${d}`;
            }
        }

        console.log(`Locking seats for Train: ${trainId}, Class: ${coachType}, Date: ${formattedDate}, Count: ${passengerCount}`);

        // 1. Cleanup expired locks first
        await TrainSeat.updateMany(
            { status: 'LOCKED', lockExpiresAt: { $lt: new Date() } },
            { $set: { status: 'AVAILABLE', lockExpiresAt: null, lockedBy: null } }
        );

        // 1b. AUTO-SEED: If no TrainSeat records exist for this train+coachType+date,
        //     create them on-the-fly so the booking flow never fails due to missing seed data.
        const existingCount = await TrainSeat.countDocuments({
            trainId: new mongoose.Types.ObjectId(trainId),
            coachType,
            date: formattedDate
        });

        if (existingCount === 0) {
            console.log(`[AUTO-SEED] No seats found for ${coachType} on ${formattedDate}. Auto-generating...`);

            // Berth type rotation for seating coaches (matches IRCTC standard)
            const berthCycle = {
                SL:  ['LB', 'MB', 'UB', 'SL', 'SU', 'LB', 'MB', 'UB'],
                '3A': ['LB', 'MB', 'UB', 'SL', 'SU', 'LB', 'MB', 'UB'],
                '2A': ['LB', 'UB', 'SL', 'SU'],
                '1A': ['LB', 'UB'],
                CC:  ['LB', 'LB', 'LB', 'LB', 'LB'],
                EC:  ['LB', 'LB', 'LB', 'LB', 'LB'],
            };
            const berths = berthCycle[coachType] || ['LB', 'MB', 'UB'];
            const seatsPerCoach = berths.length === 5 ? 72 : berths.length === 4 ? 48 : berths.length === 2 ? 24 : 72;

            // Try to get coach config; fallback to 1 coach with default seats
            const trainCoachDocs = await TrainCoach.find({ trainId: new mongoose.Types.ObjectId(trainId) }).populate('coachTypeId');
            const matchedCoaches = trainCoachDocs.filter(tc => tc.coachTypeId?.name === coachType);
            const numCoaches = matchedCoaches.length > 0 ? matchedCoaches.reduce((s, tc) => s + (tc.numberOfCoaches || 1), 0) : 2;

            const seatsToInsert = [];
            for (let c = 1; c <= numCoaches; c++) {
                const coachPrefix = coachType === 'SL' ? 'S' : coachType === '3A' ? 'B' : coachType === '2A' ? 'A' : coachType === '1A' ? 'H' : coachType;
                const coachLabel = `${coachPrefix}${c}`;
                for (let s = 1; s <= seatsPerCoach; s++) {
                    seatsToInsert.push({
                        trainId: new mongoose.Types.ObjectId(trainId),
                        coachType,
                        coachNumber: coachLabel,
                        seatNumber: s,
                        berthType: berths[(s - 1) % berths.length],
                        status: 'AVAILABLE',
                        date: formattedDate
                    });
                }
            }

            try {
                await TrainSeat.insertMany(seatsToInsert, { ordered: false }).catch(() => {});
                console.log(`[AUTO-SEED] Created ${seatsToInsert.length} seats for ${coachType} on ${formattedDate}`);
            } catch (seedErr) {
                // Ignore duplicate key errors (another request may have seeded at same time)
                console.log('[AUTO-SEED] Seed complete (some duplicates ignored)');
            }
        }

        // 2. Find AVAILABLE seats with explicit casting for reliability
        const availableSeats = await TrainSeat.find({
            trainId: new mongoose.Types.ObjectId(trainId),
            coachType,
            date: formattedDate,
            status: 'AVAILABLE'
        }).sort({ coachNumber: 1, seatNumber: 1 }).session(session);

        if (availableSeats.length < passengerCount) {
            console.log(`Reservation failed: Only ${availableSeats.length} seats available for ${coachType} on ${formattedDate}`);
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: `Not enough seats available. Only ${availableSeats.length} seat(s) left in ${coachType} class.` });
        }

        // 3. Simple Allocation Logic (Same coach preference + Berth match)
        const selectedSeats = [];
        const passengersToAssign = [...passengers];

        // Strategy: Try to find a coach that can accommodate all
        const seatsByCoach = availableSeats.reduce((acc, seat) => {
            acc[seat.coachNumber] = acc[seat.coachNumber] || [];
            acc[seat.coachNumber].push(seat);
            return acc;
        }, {});

        let candidateSeats = [];
        for (const coachNum in seatsByCoach) {
            if (seatsByCoach[coachNum].length >= passengerCount) {
                candidateSeats = seatsByCoach[coachNum].slice(0, passengerCount);
                break;
            }
        }

        // If no single coach has enough seats, just take the first available ones
        if (candidateSeats.length === 0) {
            candidateSeats = availableSeats.slice(0, passengerCount);
        }

        const lockExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // 4. Atomically LOCK seats
        const seatIds = candidateSeats.map(s => s._id);
        await TrainSeat.updateMany(
            { _id: { $in: seatIds }, status: 'AVAILABLE' },
            {
                $set: {
                    status: 'LOCKED',
                    lockExpiresAt,
                    lockedBy: userId || null
                }
            },
            { session }
        );

        // 5. Create PENDING Booking
        const allocatedSeats = candidateSeats.map(s => ({
            seatNumber: s.seatNumber,
            coachNumber: s.coachNumber,
            berthType: s.berthType
        }));

        const booking = new TrainBooking({
            pnr: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
            user: userId,
            customerName: passengers[0].name,
            train: trainId,
            passengers,
            allocatedSeats,
            irctcUserId,
            contactDetails,
            journeyDate: formattedDate,
            source: sourceId,
            destination: destinationId,
            totalFare,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            lockExpiresAt
        });

        await booking.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            booking,
            lockExpiresAt
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Lock Seats Error:', error);
        res.status(400).json({ success: false, message: error.message || 'Failed to lock seats' });
    }
};

exports.confirmBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

        // 1. Verify Payment
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // 2. Fetch Booking & Validate Lock
        const booking = await TrainBooking.findById(bookingId).session(session);
        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (new Date() > booking.lockExpiresAt) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Reservation expired. Please try again.' });
        }

        // 3. Finalize Seats (LOCKED -> BOOKED)
        const seatNumbers = booking.allocatedSeats.map(s => s.seatNumber);
        const coachNumbers = booking.allocatedSeats.map(s => s.coachNumber);

        const result = await TrainSeat.updateMany(
            {
                trainId: booking.train,
                date: booking.journeyDate,
                coachNumber: { $in: coachNumbers },
                seatNumber: { $in: seatNumbers },
                status: 'LOCKED'
            },
            { $set: { status: 'BOOKED', lockExpiresAt: null } },
            { session }
        );

        // 4. Update Booking
        booking.status = 'CONFIRMED';
        booking.paymentStatus = 'SUCCESS';
        await booking.save({ session });

        // 5. Save Payment Record
        const payment = new TrainPayment({
            bookingId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            amount: booking.totalFare,
            status: 'SUCCESS'
        });
        await payment.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ success: true, booking });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Confirm Booking Error:', error);
        res.status(500).json({ success: false, message: 'Failed to confirm booking' });
    }
};

exports.createPaymentOrder = async (req, res) => {
    try {
        const { amount, bookingId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        const options = {
            amount: Math.round(amount * 100), // paise
            currency: 'INR',
            receipt: `train_rect_${Date.now()}`,
            notes: { bookingId }
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Razorpay Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment order' });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Update booking status
            if (bookingId) {
                await TrainBooking.findByIdAndUpdate(bookingId, { status: 'CONFIRMED' });
            }
            res.status(200).json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};

exports.getBookingByPNR = async (req, res) => {
    try {
        const booking = await TrainBooking.findOne({ pnr: req.params.pnr })
            .populate('train')
            .populate('source')
            .populate('destination')
            .populate('user', 'fullName email mobileNumber');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.status(200).json({ success: true, booking });
    } catch (error) {
        console.error('Error in getBookingByPNR:', error);
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
};

// Placeholder for other controllers as needed for the 12 pages
exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalTrains,
            totalBookings,
            todayBookings,
            activeRoutes,
            revenueResult,
            recentBookings
        ] = await Promise.all([
            Train.countDocuments(),
            TrainBooking.countDocuments(),
            TrainBooking.countDocuments({ createdAt: { $gte: today } }),
            TrainRoute.countDocuments(),
            TrainBooking.aggregate([
                { $match: { status: 'CONFIRMED' } },
                { $group: { _id: null, total: { $sum: '$totalFare' } } }
            ]),
            TrainBooking.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('train user source destination')
        ]);

        // Weekly data for chart (last 7 days)
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await TrainBooking.countDocuments({
                createdAt: { $gte: date, $lt: nextDate }
            });

            weeklyData.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                bookings: count
            });
        }

        res.status(200).json({
            success: true,
            stats: {
                totalTrains,
                totalBookings,
                todayBookings,
                totalRevenue: revenueResult[0]?.total || 0,
                activeRoutes,
                weeklyData,
                recentBookings
            }
        });
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllStations = async (req, res) => {
    try {
        const stations = await Station.find();
        res.status(200).json({ success: true, stations });
    } catch (error) {
        console.error('Error in getAllStations:', error);
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
};

exports.createStation = async (req, res) => {
    try {
        const station = await Station.create(req.body);
        res.status(201).json({ success: true, station });
    } catch (error) {
        console.error('Error in createStation:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'A station with this code already exists.' });
        }
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
};

exports.getReports = async (req, res) => {
    try {
        const stats = {
            totalTrains: await Train.countDocuments(),
            totalBookings: await TrainBooking.countDocuments(),
            revenue: 125000,
            popularRoutes: [
                { from: 'Mumbai', to: 'Delhi', count: 45 },
                { from: 'Chennai', to: 'Bangalore', count: 32 }
            ]
        };
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        // Placeholder for persistent settings
        res.status(200).json({ success: true, message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTrainRoute = async (req, res) => {
    try {
        const route = await TrainRoute.findOne({ train: req.params.trainId })
            .populate('train')
            .populate('stops.station');
        res.status(200).json({ success: true, route });
    } catch (error) {
        console.error('Error in getTrainRoute:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateTrainRoute = async (req, res) => {
    try {
        const { stops } = req.body;

        if (!stops || stops.length < 2) {
            return res.status(400).json({ success: false, message: 'Route must have at least SOURCE and DESTINATION stations.' });
        }

        let route = await TrainRoute.findOne({ train: req.params.trainId });

        if (route) {
            route.stops = stops;
            await route.save();
        } else {
            route = await TrainRoute.create({ train: req.params.trainId, stops });
        }

        res.status(200).json({ success: true, route });
    } catch (error) {
        console.error('Error in updateTrainRoute:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.searchTrains = async (req, res) => {
    try {
        const { from, to, date } = req.query;

        // Cleanup expired locks first for accurate availability across all trains
        await TrainSeat.updateMany(
            { status: 'LOCKED', lockExpiresAt: { $lt: new Date() } },
            { $set: { status: 'AVAILABLE', lockExpiresAt: null, lockedBy: null } }
        );
        if (!from || !to || !date) {
            return res.status(400).json({ success: false, message: 'From, To and Date are required' });
        }

        console.log('Search Query:', { from, to, date });

        // 1. Find stations by code, name or city
        const [fromStation, toStation] = await Promise.all([
            Station.findOne({ $or: [{ code: from.toUpperCase() }, { name: new RegExp(from, 'i') }, { city: new RegExp(from, 'i') }] }),
            Station.findOne({ $or: [{ code: to.toUpperCase() }, { name: new RegExp(to, 'i') }, { city: new RegExp(to, 'i') }] })
        ]);

        console.log('Stations Found:', {
            from: fromStation?.code,
            to: toStation?.code,
            fromFound: !!fromStation,
            toFound: !!toStation
        });

        if (!fromStation || !toStation) {
            return res.status(200).json({ success: true, trains: [], message: 'Stations not found' });
        }

        // 2. Find day of week for the requested date (handling multiple formats)
        let journeyDate;
        if (date.includes('-')) {
            const parts = date.split('-');
            if (parts[0].length === 4) {
                // YYYY-MM-DD
                journeyDate = new Date(date);
            } else {
                // DD-MM-YYYY
                const [d, m, y] = parts;
                journeyDate = new Date(`${y}-${m}-${d}`);
            }
        } else {
            journeyDate = new Date(date);
        }

        if (isNaN(journeyDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid Date format. Use DD-MM-YYYY or YYYY-MM-DD' });
        }

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[journeyDate.getDay()];

        // 3. Find ALL routes and filter by station codes (more robust)
        const allRoutes = await TrainRoute.find().populate('train').populate('stops.station');

        console.log(`Checking ${allRoutes.length} total routes for ${from} (${fromStation.code}) to ${to} (${toStation.code})`);

        const matchingTrains = [];

        for (const route of allRoutes) {
            const train = route.train;
            if (!train || train.status !== 'Active') continue;

            // Check if train runs on the selected day
            if (!train.runsOn.includes(dayName) && !train.runsOn.includes('Daily')) continue;

            const stops = route.stops;
            const fromIdx = stops.findIndex(s => s.station?.code === fromStation.code);
            const toIdx = stops.findIndex(s => s.station?.code === toStation.code);

            // Check if 'to' station exists and comes after 'from' station
            if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
                const fromStop = stops[fromIdx];
                const toStop = stops[toIdx];

                console.log(`Matched Train: ${train.name} (${train.number})`);

                // Duration calculation
                const parseTime = (timeStr) => {
                    if (!timeStr) return 0;
                    const [h, m] = timeStr.split(':').map(Number);
                    return (h * 60) + (m || 0);
                };
                const depTime = fromStop.departureTime || fromStop.arrivalTime || '00:00';
                const arrTime = toStop.arrivalTime || toStop.departureTime || '00:00';

                const depMins = parseTime(depTime);
                let arrMins = parseTime(arrTime);
                if (arrMins < depMins) arrMins += 24 * 60;
                const diffMins = arrMins - depMins;
                const hrs = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                const duration = `${hrs}h ${mins}m`;

                const distance = Math.max(0, (toStop.distance || 500) - (fromStop.distance || 0));

                // Use UTC methods to avoid timezone-induced date shifts
                const yyyy = journeyDate.getUTCFullYear();
                const mm = String(journeyDate.getUTCMonth() + 1).padStart(2, '0');
                const dd = String(journeyDate.getUTCDate()).padStart(2, '0');
                const dateString = `${yyyy}-${mm}-${dd}`;

                let classMap = [];

                // ── PRIMARY: Use new Granular TrainSeat system ──
                // Using countDocuments is more reliable than aggregate here
                const getSeatCount = (ct) => TrainSeat.countDocuments({
                    trainId: new mongoose.Types.ObjectId(train._id),
                    date: dateString,
                    coachType: ct,
                    status: 'AVAILABLE'
                });

                const trainCoaches = await TrainCoach.find({ trainId: train._id }).populate('coachTypeId');

                if (trainCoaches.length > 0) {
                    for (const tc of trainCoaches) {
                        if (!tc.coachTypeId) continue;
                        const availableCount = await getSeatCount(tc.coachTypeId.name);

                        // Fetch price from inventory or fallback
                        let inv = await SeatInventory.findOne({ trainId: train._id, coachTypeId: tc.coachTypeId._id, date: dateString });
                        if (!inv) inv = await SeatInventory.findOne({ trainId: train._id, coachTypeId: tc.coachTypeId._id, date: null });

                        classMap.push({
                            type: tc.coachTypeId.name,
                            price: inv ? inv.price : Math.round(distance * 1.5),
                            available: availableCount
                        });
                    }
                }

                // Construct result — NO hardcoded fallback classes
                matchingTrains.push({
                    trainId: train._id,
                    trainName: train.name,
                    trainNumber: train.number,
                    departureTime: depTime,
                    arrivalTime: arrTime,
                    duration: duration,
                    sourceCity: fromStation.name,
                    destCity: toStation.name,
                    sourceId: fromStation._id,
                    destinationId: toStation._id,
                    distance: distance,
                    runsOn: train.runsOn,
                    classes: classMap
                });
            }
        }

        if (matchingTrains.length > 0) {
            return res.status(200).json({ success: true, trains: matchingTrains });
        } else {
            return res.status(200).json({ success: true, trains: [], message: `No trains found between ${fromStation.code} and ${toStation.code} on ${dayName}` });
        }
    } catch (error) {
        console.error('Error in searchTrains:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await TrainBooking.findById(id)
            .populate('train')
            .populate('source')
            .populate('destination');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.status(200).json({ success: true, booking });
    } catch (error) {
        console.error('Get Booking Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch booking details' });
    }
};

exports.generateTicketPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await TrainBooking.findById(id)
            .populate('train')
            .populate('source')
            .populate('destination');

        if (!booking) {
            return res.status(404).send('Booking not found');
        }

        // Generate Secure Verification Token
        const token = crypto.createHmac('sha256', process.env.JWT_SECRET || 'fallback_secret')
            .update(booking.pnr)
            .digest('hex');
            
        // Construct Direct PDF Download URL (Points to backend API)
        let host = req.get('host');
        // If testing locally, map localhost to the actual WiFi IP so mobile phones can access it
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
            const os = require('os');
            const interfaces = os.networkInterfaces();
            let localIp = '127.0.0.1';
            for (const name of Object.keys(interfaces)) {
                for (const iface of interfaces[name]) {
                    if (iface.family === 'IPv4' && !iface.internal) {
                        localIp = iface.address;
                        break;
                    }
                }
            }
            const port = host.split(':')[1] || '5000';
            host = `${localIp}:${port}`;
        }
        
        const protocol = host.match(/^[0-9.]+:\d+$/) || host.includes('localhost') ? 'http' : 'https';
        const backendUrl = process.env.BACKEND_URL || `${protocol}://${host}`;
        const verificationUrl = `${backendUrl}/api/trains/ticket/${booking.pnr}/pdf?token=${token}`;
        
        // Generate QR code with the URL
        const qrCodeDataURL = await qrcode.toDataURL(verificationUrl, { margin: 1, width: 150 });

        // Generate HTML from template
        const htmlContent = generateTicketHTML(booking, qrCodeDataURL);

        // Launch puppeteer
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Load HTML content
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Generate PDF Buffer
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px'
            }
        });

        await browser.close();

        // Store the PDF in the backend/tickets folder
        const ticketsDir = path.join(__dirname, '..', 'tickets');
        if (!fs.existsSync(ticketsDir)) {
            fs.mkdirSync(ticketsDir, { recursive: true });
        }
        const filePath = path.join(ticketsDir, `${booking.pnr}.pdf`);
        fs.writeFileSync(filePath, pdfBuffer);

        // HTTP headers for PDF download / display
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket_${booking.pnr}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.end(pdfBuffer);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).send('Failed to generate ticket PDF');
    }
};

exports.downloadTicketByPNR = async (req, res) => {
    try {
        const { pnr } = req.params;
        const { token } = req.query;

        if (!pnr || !token) {
            return res.status(400).json({ success: false, message: 'Missing PNR or Security Token' });
        }

        const expectedToken = crypto.createHmac('sha256', process.env.JWT_SECRET || 'fallback_secret')
            .update(pnr)
            .digest('hex');

        if (token !== expectedToken) {
            return res.status(403).json({ success: false, message: 'Invalid or tampered ticket token' });
        }

        const filePath = path.join(__dirname, '..', 'tickets', `${pnr}.pdf`);

        if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="ticket_${pnr}.pdf"`);
            return res.download(filePath, `ticket_${pnr}.pdf`);
        } else {
            return res.status(404).json({ success: false, message: 'Ticket PDF not found on server storage' });
        }
    } catch (error) {
        console.error('Ticket Download Error:', error);
        res.status(500).json({ success: false, message: 'Server error during PDF download' });
    }
};

exports.verifyTicket = async (req, res) => {
    try {
        const { pnr } = req.params;
        const { token } = req.query;

        if (!pnr || !token) {
            return res.status(400).json({ success: false, message: 'Missing PNR or Verification Token' });
        }

        const expectedToken = crypto.createHmac('sha256', process.env.JWT_SECRET || 'fallback_secret')
            .update(pnr)
            .digest('hex');

        if (token !== expectedToken) {
            return res.status(403).json({ success: false, message: 'Invalid or tampered ticket verification token' });
        }

        const booking = await TrainBooking.findOne({ pnr })
            .populate('train')
            .populate('source')
            .populate('destination');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.status(200).json({ success: true, booking });
    } catch (error) {
        console.error('Ticket Verification Error:', error);
        res.status(500).json({ success: false, message: 'Server error during verification' });
    }
};

// ── Get user-specific train bookings ─────────────────────────────────────────
exports.getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const bookings = await TrainBooking.find({ user: userId })
            .populate('train', 'name number source destination')
            .populate('source', 'name code')
            .populate('destination', 'name code')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error('Get User Bookings Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
};

// ── Internal: promote WL → RAC → CONFIRMED on seat release ──────────────────
async function promoteNextPassengers(trainId, journeyDate, coachType, session) {
    const nextRacBooking = await TrainBooking.findOne({
        train: trainId, journeyDate,
        'passengers.coachType': coachType, status: 'RAC'
    }).sort({ createdAt: 1 }).session(session);

    if (nextRacBooking) {
        const availableSeats = await TrainSeat.find({
            trainId, date: journeyDate, coachType, status: 'AVAILABLE'
        }).sort({ coachNumber: 1, seatNumber: 1 }).limit(nextRacBooking.passengers.length).session(session);

        if (availableSeats.length >= nextRacBooking.passengers.length) {
            await TrainSeat.updateMany(
                { _id: { $in: availableSeats.map(s => s._id) } },
                { $set: { status: 'BOOKED' } }, { session }
            );
            nextRacBooking.status = 'CONFIRMED';
            nextRacBooking.allocatedSeats = availableSeats.map(s => ({
                seatNumber: s.seatNumber, coachNumber: s.coachNumber, berthType: s.berthType
            }));
            await nextRacBooking.save({ session });

            const nextWlBooking = await TrainBooking.findOne({
                train: trainId, journeyDate,
                'passengers.coachType': coachType, status: 'WL'
            }).sort({ createdAt: 1 }).session(session);
            if (nextWlBooking) { nextWlBooking.status = 'RAC'; await nextWlBooking.save({ session }); }
        }
    }
}

// ── Cancel booking with refund + auto-promotion ──────────────────────────────
exports.cancelBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { bookingId } = req.body;
        const booking = await TrainBooking.findById(bookingId).session(session);
        if (!booking) { await session.abortTransaction(); return res.status(404).json({ success: false, message: 'Booking not found' }); }
        if (booking.status === 'CANCELLED') { await session.abortTransaction(); return res.status(400).json({ success: false, message: 'Already cancelled' }); }

        const oldStatus = booking.status;
        const coachType = booking.passengers[0].coachType;

        if (oldStatus === 'CONFIRMED') {
            for (const seat of booking.allocatedSeats) {
                await TrainSeat.findOneAndUpdate(
                    { trainId: booking.train, date: booking.journeyDate, coachNumber: seat.coachNumber, seatNumber: seat.seatNumber },
                    { $set: { status: 'AVAILABLE', lockExpiresAt: null, lockedBy: null } },
                    { session }
                );
            }
        }

        booking.status = 'CANCELLED';
        booking.paymentStatus = 'REFUNDED';
        booking.isRefunded = true;
        booking.refundAmount = booking.totalFare * 0.8;
        await booking.save({ session });

        if (oldStatus === 'CONFIRMED') {
            await promoteNextPassengers(booking.train, booking.journeyDate, coachType, session);
        }

        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ success: true, message: 'Booking cancelled successfully', refundAmount: booking.refundAmount });
    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        console.error('Cancel Booking Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to cancel booking' });
    }
};

// ── Admin: all bookings ───────────────────────────────────────────────────────
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await TrainBooking.find()
            .populate('train', 'name number')
            .populate('user', 'name email mobileNumber')
            .populate('source', 'name code')
            .populate('destination', 'name code')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
};

// ── Admin: reports ────────────────────────────────────────────────────────────
exports.getTrainReports = async (req, res) => {
    try {
        const totalTrains = await Train.countDocuments();
        const totalBookings = await TrainBooking.countDocuments();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayBookings = await TrainBooking.countDocuments({ createdAt: { $gte: today } });
        const revenueData = await TrainBooking.aggregate([
            { $match: { paymentStatus: 'SUCCESS', status: { $ne: 'CANCELLED' } } },
            { $group: { _id: null, total: { $sum: '$totalFare' } } }
        ]);
        const bookingTrend = await TrainBooking.aggregate([
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }, { $limit: 7 }
        ]);
        res.status(200).json({ success: true, data: { totalTrains, totalBookings, todayBookings, totalRevenue: revenueData[0]?.total || 0, bookingTrend } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch reports' });
    }
};

// ── Admin: manual queue promotion ─────────────────────────────────────────────
exports.promoteManual = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { bookingId } = req.params;
        const booking = await TrainBooking.findById(bookingId).session(session);
        if (!booking) { await session.abortTransaction(); return res.status(404).json({ success: false, message: 'Booking not found' }); }
        await promoteNextPassengers(booking.train, booking.journeyDate, booking.passengers[0].coachType, session);
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ success: true, message: 'Manual promotion executed' });
    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, message: error.message || 'Promotion failed' });
    }
};
