import dotenv from "dotenv";
dotenv.config(); // ✅ Charge les variables ici aussi

import { v2 as cloudinary } from "cloudinary";

console.log("🔍 Cloudinary env:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET ? "✅ loaded" : "❌ missing",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
