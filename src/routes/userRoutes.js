/*import express from 'express';
import upload from "../middleware/upload.js";
import { registerUser } from '../controllers/userController.js';

const router = express.Router();

// POST /api/users/register
router.post('/register', upload.single('photo'), registerUser);

export default router;*/
import express from "express";
import upload from "../middleware/upload.js";
import { registerUser, registerProvider,loginUser  } from "../controllers/userController.js";

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

export default router;

