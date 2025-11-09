import express from "express";
import uploadProvider from "../middleware/uploadProvider.js";
import { registerProvider } from "../controllers/providerController.js";

const router = express.Router();

// Inscription prestataire avec uploads multiples
router.post(
  "/register",
  uploadProvider.fields([
    { name: "photo", maxCount: 1 },
    { name: "certifications", maxCount: 5 },
    { name: "documents", maxCount: 5 },
  ]),
  registerProvider
);

export default router;
