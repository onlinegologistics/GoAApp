const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const Coupon = require("./models/Coupon");

const heroImageRoutes = require('./routes/heroImages');


const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const operatorRoutes = require("./routes/operatorRoutes");
const busRoutes = require("./routes/busRoutes");
const routeRoutes = require("./routes/routeRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const couponRoutes = require("./routes/couponRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const cityRoutes = require("./routes/cityRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const trainRoutes = require("./routes/trainRoutes");
const superAdminTrainRoutes = require("./routes/superAdminTrainRoutes");
const coachRoutes = require("./routes/coachRoutes");
const commissionRoutes = require("./routes/commissionRoutes");
const pricingRoutes = require("./routes/pricingRoutes");
const assetRoutes = require("./routes/assetRoutes");
const adRoutes = require("./routes/adRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const userDirectoryRoutes = require("./routes/userDirectoryRoutes");
const operatorManagementRoutes = require("./routes/operatorRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const busRequestRoutes = require("./routes/busRequestRoutes");
const busOperatorRoutes = require("./routes/busOperatorRoutes");
const destinationRoutes = require("./routes/destinationRoutes");

// Hotel module routes
const hotelRoutes = require('./routes/hotel/hotelRoutes');

// Flight module routes
const flightRoutes = require('./routes/Flight/flightRoutes');


const videoContentRoutes = require('./routes/videoContentRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/content', videoContentRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/inquiries', inquiryRoutes);

// Request logger - MUST be above other routes
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length) {
        console.log("Request Body:", JSON.stringify(req.body, null, 2));
    }
    next();
});

app.use('/uploads', express.static('uploads'));
app.use('/uploads/destinations', express.static('uploads/destinations'));
app.use('/uploads/videos', express.static('uploads/videos'));
app.use('/uploads/reviews', express.static('uploads/reviews'));

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/operators", operatorRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/bus", busRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/payments", paymentRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/admin/bus-requests", busRequestRoutes);
app.use("/api/admin/train", superAdminTrainRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/train-bookings", trainRoutes);
app.use("/api/pnr", trainRoutes);
app.use("/api", coachRoutes);
app.use("/api/bus-operator", busOperatorRoutes);

// Hotel module
app.use('/api/hotels', hotelRoutes);

// Flight module
app.use('/api/flights', flightRoutes);

app.use('/api/commission', commissionRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/banner', bannerRoutes);
app.use('/api/user-directory', userDirectoryRoutes);
app.use('/api/operator-mgmt', operatorManagementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/hero-images', heroImageRoutes);
app.use('/uploads/banners', require('express').static('uploads/banners'));


app.get("/", (req, res) => {
    res.send("App backend is live");
});

// Auto Expire Coupons Cron Job (Runs every hour)
cron.schedule("0 * * * *", async () => {
    try {
        const result = await Coupon.updateMany(
            { validTill: { $lt: new Date() }, status: "Active" },
            { status: "Expired" }
        );
        if (result.modifiedCount > 0) {
            console.log(`[Cron] Expired ${result.modifiedCount} coupons.`);
        }
    } catch (err) {
        console.error("[Cron] Error expiring coupons:", err);
    }
});

// Auto Sync Hotels Cleartrip Content Cron Job (Runs every Sunday at 3:00 AM)
cron.schedule("0 3 * * 0", async () => {
    try {
        const { syncAllHotelsCron } = require('./controllers/hotel/hotelController');
        await syncAllHotelsCron();
    } catch (err) {
        console.error("[Cron] Error running hotel sync job:", err);
    }
});

module.exports = app;