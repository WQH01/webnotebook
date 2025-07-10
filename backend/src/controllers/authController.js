const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const User = require('../models/user');

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    if (await User.findByUsername(username)) return res.status(400).json({ message: 'Username exists' });
    if (await User.findByEmail(email)) return res.status(400).json({ message: 'Email exists' });
    const hash = await bcrypt.hash(password, 10);
    const id = await User.createUser({ username, email, password: hash });
    res.json({ id, username, email });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findByUsername(username);
    if (!user) return res.status(400).json({ message: 'User not found' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Wrong password' });
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
};

exports.me = async (req, res) => {
    const { id, username, email, createdAt } = req.user;
    res.json({ id, username, email, createdAt });
}; 