/**
 * Utility to generate unique flight identifiers
 */

const crypto = require('crypto');

const generatePNR = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const generateBookingId = () => {
    return 'FL' + Date.now().toString().slice(-8) + crypto.randomInt(10, 99);
};

const generateTicketNumber = () => {
    return 'ETKT' + Math.floor(Math.random() * 900000000000 + 100000000000);
};

module.exports = {
    generatePNR,
    generateBookingId,
    generateTicketNumber
};
