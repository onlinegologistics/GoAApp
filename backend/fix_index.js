const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndex() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const AdminRequest = mongoose.model('AdminRequest', new mongoose.Schema({}));
        
        try {
            await AdminRequest.collection.dropIndex("username_1");
            console.log("Index 'username_1' dropped successfully.");
        } catch (e) {
            console.log("Index 'username_1' not found or already dropped.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixIndex();
