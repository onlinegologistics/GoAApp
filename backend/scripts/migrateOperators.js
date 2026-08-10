const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Operator = require('../models/Operator');

const migrateOperators = async () => {
    try {
        console.log('--- Starting Operator Migration ---');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const operators = await Operator.find();
        let updatedCount = 0;

        for (const op of operators) {
            let changed = false;

            // 1. Normalize Email
            const originalEmail = op.email;
            op.email = op.email.toLowerCase().trim();
            if (op.email !== originalEmail) changed = true;

            // 2. Add Role if missing
            if (!op.role) {
                op.role = 'operator';
                changed = true;
            }

            // 3. Hash Password if it looks like plain text
            // Bcrypt hashes usually start with $2a$, $2b$, or $2y$
            const isHashed = op.password.startsWith('$2a$') || op.password.startsWith('$2b$') || op.password.startsWith('$2y$');
            
            if (!isHashed) {
                console.log(`Hashing plain-text password for: ${op.email}`);
                // Assigning directly will trigger the pre('save') hook
                // OR we can hash it manually here
                op.password = await bcrypt.hash(op.password, 10);
                changed = true;
            }

            if (changed) {
                await op.save();
                updatedCount++;
            }
        }

        console.log(`--- Migration Finished. Updated ${updatedCount} operators. ---`);
        process.exit(0);
    } catch (err) {
        console.error('Migration Error:', err);
        process.exit(1);
    }
};

migrateOperators();
