const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Get token from header
    const authHeader = req.header('Authorization');

    // Check for "Bearer " token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token or invalid token format, authorization denied' });
    }

    try {
        // Extract token from "Bearer <token>"
        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user from payload
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};