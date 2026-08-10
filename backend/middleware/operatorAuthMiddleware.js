const jwt = require('jsonwebtoken');

const operatorAuthMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

        // Ensure the token belongs to an operator (flexible role check)
        const allowedRoles = ['operator', 'bus_operator'];
        if (!allowedRoles.includes(decoded.role)) {
            return res.status(403).json({ error: 'Access denied. Not an operator.' });
        }

        req.operator = decoded; // Attach operator info (id, role) to request
        next();
    } catch (ex) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

module.exports = { operatorAuthMiddleware };
