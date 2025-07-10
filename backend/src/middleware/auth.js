const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { findById } = require('../models/user');

module.exports = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    try {
        const decoded = jwt.verify(token, jwtSecret);
        const user = await findById(decoded.id);
        if (!user) return res.status(401).json({ message: 'User not found' });
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
}; 