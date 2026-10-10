const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    const err = new Error('Only JPG, PNG, GIF or WEBP images are allowed.');
    err.status = 400;
    cb(err);
  },
});

function deleteImage(filename) {
  if (!filename) return;
  fs.unlink(path.join(uploadDir, path.basename(filename)), () => {});
}

module.exports = { upload, deleteImage, uploadDir };
