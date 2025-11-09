/*import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "servconnect_users", // nom du dossier Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

export default upload;*/

// src/middleware/uploadProvider.js
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

export default upload;

