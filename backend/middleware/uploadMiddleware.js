/**
 * Multer middleware for forum image uploads.
 * Saves files to uploads/forum with a unique filename.
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'forum');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = (file.originalname && path.extname(file.originalname)) || '.jpg';
    cb(null, uniqueSuffix + ext.toLowerCase());
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpe?g|png|gif|webp)$/i.test(file.originalname) || file.mimetype?.startsWith('image/');
  if (allowed) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, gif, webp) are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { upload };
