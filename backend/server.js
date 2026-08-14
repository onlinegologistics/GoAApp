const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = require("./app");
const seedSuperAdmin = require("./config/seed");

// Prevent server crash on unhandled errors
process.on('uncaughtException', (err) => {
    console.error('⚠️  UNCAUGHT EXCEPTION (server kept alive):', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️  UNHANDLED REJECTION (server kept alive):', reason);
});

// Increase timeout to handle slow internet/Atlas connections
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 60000,
    connectTimeoutMS: 60000
})
    .then(async () => {
        console.log("MongoDB Connected Successfully");
        await seedSuperAdmin();

        // Initialize Boarding Reminder Cron
        const { initReminderCron } = require('./services/reminderCron');
        initReminderCron();

        // Initialize Cleartrip Hotel Incremental Updates Scheduler
        const { syncAllHotelsCron } = require('./controllers/hotel/hotelController');
        syncAllHotelsCron();

        const port = process.env.PORT || 5001;
        const server = app.listen(port, () => {
            console.log(` 🚀 Server running on port ${port}`);
        });
        
        // Increase timeout for large video uploads (10 minutes)
        server.timeout = 600000;
        server.keepAliveTimeout = 600000;
    })
    .catch((err) => {
        console.error("MongoDB Connection Error:", err.message);
        console.log("-----------------------------------------");
        console.log("TIP: If this fails, check your internet or white-list your IP in Atlas.");
        console.log("-----------------------------------------");
    });
// Restart trigger comment for register password flow integration