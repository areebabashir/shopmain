const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads", "settings");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedExt = /\.(jpe?g|png|gif|webp|svg)$/i;
  const okMime = /^image\/(jpeg|png|gif|webp|svg\+xml)$/i.test(file.mimetype);
  if (allowedExt.test(file.originalname) && okMime) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"));
  }
};

const uploadSettingsImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = uploadSettingsImage;
