const express = require('express');
const mongoose = require('mongoose');
const { Item, CATEGORIES } = require('../models/Item');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload, deleteImage } = require('../middleware/upload');

const router = express.Router();

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Hide contact details from visitors who are not logged in
function serialize(item, req) {
  const obj = item.toObject();
  if (!req.user) {
    if (obj.owner && typeof obj.owner === 'object') delete obj.owner.email;
    delete obj.contactInfo;
  }
  return obj;
}

function canModify(item, user) {
  if (user.role === 'admin') return true;
  const ownerId = item.owner && item.owner._id ? item.owner._id : item.owner;
  return String(ownerId) === String(user._id);
}

function validateFields(body) {
  const data = {
    title: str(body.title),
    type: str(body.type),
    category: str(body.category),
    location: str(body.location),
    description: str(body.description),
    contactInfo: str(body.contactInfo).replace(/[\s-]/g, ''),
  };
  const errors = [];

  if (!data.title) errors.push('Item name is required.');
  else if (data.title.length > 100) errors.push('Item name must be 100 characters or fewer.');
  if (!['lost', 'found'].includes(data.type)) errors.push('Type must be "lost" or "found".');
  if (!CATEGORIES.includes(data.category)) errors.push('Please choose a valid category.');
  if (!data.location) errors.push('Location is required.');
  if (!data.description) errors.push('Description is required.');
  else if (data.description.length > 1000) errors.push('Description must be 1000 characters or fewer.');
  if (!/^\d{10}$/.test(data.contactInfo)) errors.push('Phone number must be exactly 10 digits.');

  const date = new Date(str(body.date));
  if (!str(body.date) || isNaN(date.getTime())) errors.push('A valid date is required.');
  else if (date.getTime() > Date.now() + 24 * 60 * 60 * 1000) errors.push('Date cannot be in the future.');
  else data.date = date;

  return { data, errors };
}

// ---- Public: stats (must be before "/:id") ----
router.get('/stats', async (req, res, next) => {
  try {
    const [lostOpen, foundOpen, resolved, total] = await Promise.all([
      Item.countDocuments({ type: 'lost', status: 'open' }),
      Item.countDocuments({ type: 'found', status: 'open' }),
      Item.countDocuments({ status: 'resolved' }),
      Item.countDocuments({}),
    ]);
    res.json({ lostOpen, foundOpen, resolved, total });
  } catch (err) {
    next(err);
  }
});

// ---- Logged in: my items (must be before "/:id") ----
router.get('/mine', protect, async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort({ createdAt: -1 }).populate('owner', 'name email');
    res.json(items.map((i) => serialize(i, req)));
  } catch (err) {
    next(err);
  }
});

// ---- Public: list + search + filter ----
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const q = str(req.query.q);
    const type = str(req.query.type);
    const category = str(req.query.category);
    const status = str(req.query.status);
    const location = str(req.query.location);

    const filter = {};
    if (['lost', 'found'].includes(type)) filter.type = type;
    if (CATEGORIES.includes(category)) filter.category = category;
    if (['open', 'resolved'].includes(status)) filter.status = status;
    if (location) filter.location = new RegExp(escapeRegex(location), 'i');
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { location: rx }, { category: rx }];
    }

    const items = await Item.find(filter).sort({ createdAt: -1 }).populate('owner', 'name email');
    res.json(items.map((i) => serialize(i, req)));
  } catch (err) {
    next(err);
  }
});

// ---- Public: single item ----
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Item not found.' });
    const item = await Item.findById(req.params.id).populate('owner', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    res.json(serialize(item, req));
  } catch (err) {
    next(err);
  }
});

// ---- Create ----
router.post('/', protect, upload.single('image'), async (req, res, next) => {
  const uploaded = req.file ? req.file.filename : '';
  try {
    const { data, errors } = validateFields(req.body);
    if (errors.length) {
      deleteImage(uploaded);
      return res.status(400).json({ message: errors.join(' ') });
    }
    const item = await Item.create({ ...data, image: uploaded, owner: req.user._id });
    await item.populate('owner', 'name email');
    res.status(201).json(serialize(item, req));
  } catch (err) {
    deleteImage(uploaded);
    next(err);
  }
});

// ---- Update (owner or admin) ----
router.put('/:id', protect, upload.single('image'), async (req, res, next) => {
  const uploaded = req.file ? req.file.filename : '';
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      deleteImage(uploaded);
      return res.status(404).json({ message: 'Item not found.' });
    }
    const item = await Item.findById(req.params.id);
    if (!item) {
      deleteImage(uploaded);
      return res.status(404).json({ message: 'Item not found.' });
    }
    if (!canModify(item, req.user)) {
      deleteImage(uploaded);
      return res.status(403).json({ message: 'You can only edit your own items.' });
    }

    const { data, errors } = validateFields(req.body);
    if (errors.length) {
      deleteImage(uploaded);
      return res.status(400).json({ message: errors.join(' ') });
    }

    Object.assign(item, data);
    if (uploaded) {
      deleteImage(item.image);
      item.image = uploaded;
    } else if (req.body.removeImage === 'true') {
      deleteImage(item.image);
      item.image = '';
    }
    await item.save();
    await item.populate('owner', 'name email');
    res.json(serialize(item, req));
  } catch (err) {
    deleteImage(uploaded);
    next(err);
  }
});

// ---- Toggle open/resolved (owner or admin) ----
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Item not found.' });
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    if (!canModify(item, req.user)) return res.status(403).json({ message: 'You can only update your own items.' });

    item.status = item.status === 'open' ? 'resolved' : 'open';
    await item.save();
    await item.populate('owner', 'name email');
    res.json(serialize(item, req));
  } catch (err) {
    next(err);
  }
});

// ---- Delete (owner or admin) ----
router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Item not found.' });
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    if (!canModify(item, req.user)) return res.status(403).json({ message: 'You can only delete your own items.' });

    deleteImage(item.image);
    await item.deleteOne();
    res.json({ message: 'Item deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
