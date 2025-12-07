/* 
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "servconnect_users",
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
    public_id: `${Date.now()}-${file.originalname}`,
  }),
});

// Middleware Multer
const upload = multer({ storage });

export default upload; */

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Déterminer le format selon le type de fichier
    const isImage = file.mimetype.startsWith("image/");
    const isPdf = file.mimetype === "application/pdf";

    return {
      folder: "servconnect_users",
      allowed_formats: isImage ? ["jpg", "jpeg", "png", "webp"] : ["pdf"],
      resource_type: isPdf ? "raw" : "image", // ✅ Important pour les PDFs
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
    };
  },
});

// Middleware Multer de base
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max (increased from 5MB)
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format non autorisé. Utilisez JPG, PNG ou PDF."));
    }
  },
});

// ✅ Configuration spécifique pour l'inscription provider
export const uploadProviderDocs = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "certifications", maxCount: 10 },
  { name: "documents", maxCount: 10 },
]);

// ✅ Configuration pour upload d'un seul document
export const uploadSingleDoc = upload.single("document");

// Export par défaut pour les clients (photo uniquement)
export default upload;
