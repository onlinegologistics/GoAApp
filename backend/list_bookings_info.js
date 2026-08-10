const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const dbUri = process.env.MONGO_URI;
console.log('Using DB URI:', dbUri ? 'Loaded successfully' : 'Not loaded');

mongoose.connect(dbUri)
    .then(async () => {
        console.log('Connected to DB successfully.');
        const User = require('./models/User');
        const HotelBooking = require('./models/hotel/HotelBooking');

        const users = await User.find({}, 'fullName email');
        console.log('All Users:');
        console.log(JSON.stringify(users, null, 2));

        const bookings = await HotelBooking.find({});
        console.log('All Hotel Bookings:');
        console.log(JSON.stringify(bookings, null, 2));

        process.exit(0);
    })
    .catch(err => {
        console.error('DB error:', err);
        process.exit(1);
    });
