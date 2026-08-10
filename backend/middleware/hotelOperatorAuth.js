const jwt = require('jsonwebtoken');
const HotelOperator = require('../models/hotel/HotelOperator');

/**
 * Middleware: verifyHotelOperator
 * - Verifies JWT token from Authorization header
 * - Ensures the account has role hotel_operator
 * - Attaches { operatorId, name, permissions, ... } to req.hotelOperator
 */
const verifyHotelOperator = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided. Please login.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

        const operator = await HotelOperator.findById(decoded.id).select('-password');
        if (!operator) {
            return res.status(401).json({ error: 'Hotel operator account not found.' });
        }

        if (operator.status !== 'Active') {
            return res.status(403).json({ error: 'Your account is inactive. Contact admin.' });
        }

        req.hotelOperator = operator;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
    }
};

/**
 * Permission guard factory
 * Usage: requirePermission('addHotel')
 */
const requirePermission = (permission) => (req, res, next) => {
    const permissions = req.hotelOperator?.permissions || [];
    const has = permissions.includes(permission) ||
        permissions.includes(permission.replace(/([A-Z])/g, ' $1').trim()); // handle space-format too
    if (!has) {
        return res.status(403).json({ error: `Permission denied: '${permission}' required.` });
    }
    next();
};

module.exports = { verifyHotelOperator, requirePermission };
