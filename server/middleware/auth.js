const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function loadUser(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    return await User.findById(decoded.id);
  } catch (err) {
    return null;
  }
}

// Requires a valid login
async function protect(req, res, next) {
  const user = await loadUser(req);
  if (!user) return res.status(401).json({ message: 'Not authorized. Please log in.' });
  req.user = user;
  next();
}

// Attaches req.user if logged in, otherwise req.user = null
async function optionalAuth(req, res, next) {
  req.user = await loadUser(req);
  next();
}

function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access required.' });
}

module.exports = { protect, optionalAuth, adminOnly };
