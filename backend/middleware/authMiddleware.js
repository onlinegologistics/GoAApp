const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (ex) {
        console.error("[Auth] JWT Verification Failed:", ex.message, "Token start:", token.substring(0, 10));
        res.status(401).json({ error: 'Invalid token.' });
    }
};

const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
    } catch (ex) {
        // Silently skip if token is invalid
    }
    next();
};

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
};

module.exports = { authMiddleware, optionalAuth, checkRole };
