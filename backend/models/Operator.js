const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const operatorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    companyName: { type: String, required: true },
    address: { type: String },
    role: { type: String, default: 'operator' },
    status: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },
    isDeleted: { type: Boolean, default: false },
    // Admin Data Isolation: link operator to the admin who created them
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    }
}, { timestamps: true });

// Hash password before saving
operatorSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
operatorSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Operator', operatorSchema);
