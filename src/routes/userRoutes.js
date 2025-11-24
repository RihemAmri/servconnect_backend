/* 
import express from "express";
import upload from "../middleware/upload.js";
import { registerUser, registerProvider,loginUser , forgotPassword, resetPassword } from "../controllers/userController.js";

const router = express.Router();

// Route pour inscription client
router.post("/register", upload.single("photo"), registerUser);

// Route pour inscription prestataire
router.post(
  "/register-provider",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "certifications", maxCount: 5 },
    { name: "documents", maxCount: 5 },
  ]),
  registerProvider
);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router; */

import express from "express";
import upload, { uploadProviderDocs } from "../middleware/upload.js";
import {
  registerUser,
  registerProvider,
  loginUser,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";

const router = express.Router();

// 📌 Route pour inscription CLIENT (photo uniquement)
router.post("/register", upload.single("photo"), registerUser);

// 📌 Route pour inscription PRESTATAIRE (photo + certificats + documents)
router.post("/register-provider", uploadProviderDocs, registerProvider);

// 📌 Route de connexion
router.post("/login", loginUser);

// 📌 Routes de récupération de mot de passe
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
