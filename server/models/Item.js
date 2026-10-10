const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics',
  'Books & Stationery',
  'ID / Cards',
  'Keys',
  'Bags & Wallets',
  'Clothing & Accessories',
  'Sports Equipment',
  'Other',
];

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, enum: ['lost', 'found'], required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    location: { type: String, required: true, trim: true, maxlength: 150 },
    date: { type: Date, required: true },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    image: { type: String, default: '' }, // file name inside server/uploads
    contactInfo: { type: String, default: '', trim: true, maxlength: 100 },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Item = mongoose.model('Item', itemSchema);

module.exports = { Item, CATEGORIES };
