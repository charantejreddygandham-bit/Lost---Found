const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { Item } = require('../models/Item');
const { protect, adminOnly } = require('../middleware/auth');
const { deleteImage } = require('../middleware/upload');

const router = express.Router();

// Admin only: list all users
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })));
  } catch (err) {
    next(err);
  }
});

// Admin only: delete a user (and their items)
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'User not found.' });
    if (String(req.user._id) === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Admin accounts cannot be deleted here.' });

    const items = await Item.find({ owner: user._id });
    items.forEach((i) => deleteImage(i.image));
    await Item.deleteMany({ owner: user._id });
    await user.deleteOne();
    res.json({ message: 'User and their items deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
