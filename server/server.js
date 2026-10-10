require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret';

const connectDB = require('./config/db');
const User = require('./models/User');
const { uploadDir } = require('./middleware/upload');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/items', require('./routes/items'));

// Unknown API routes -> JSON 404
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found.' }));

// Serve the built React app (after "npm run build") from the same server
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5MB or smaller.' : err.message;
    return res.status(400).json({ message });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(' ') });
  }
  console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error. Please try again.' });
});

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@campus.edu').toLowerCase();
  const exists = await User.findOne({ email });
  if (exists) return;
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  await User.create({
    name: process.env.ADMIN_NAME || 'Campus Admin',
    email,
    password: await bcrypt.hash(password, 10),
    role: 'admin',
  });
  console.log(`Admin account created -> ${email} / ${password}`);
}

async function start() {
  await connectDB();
  await seedAdmin();
  const port = process.env.PORT || 5001;
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}

start();
