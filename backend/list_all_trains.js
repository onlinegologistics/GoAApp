const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Train = require('./models/train/Train');
const Station = require('./models/train/Station');

async function checkAllTrains() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const trains = await Train.find().populate('source').populate('destination');
        for (const t of trains) {
            console.log('Train:', t.name, '(', t.number, ')');
            console.log('From:', t.source?.name, '(', t.source?.code, ')');
            console.log('To:', t.destination?.name, '(', t.destination?.code, ')');
            console.log('---');
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkAllTrains();
