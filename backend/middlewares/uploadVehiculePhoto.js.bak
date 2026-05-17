const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Dossier de stockage local des photos véhicules.
const uploadDir = path.join(__dirname, "..", "uploads", "vehicules");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du nommage et de la destination des fichiers uploadés.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp'
    };

    const ext = mimeToExt[file.mimetype] || '.bin';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

// Accepte uniquement les fichiers image.
const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seules les images sont autorisees"));
  }
};

// Middleware prÃªt Ã  l'emploi pour l'upload photo véhicule.
const uploadVehiculePhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { uploadVehiculePhoto };


