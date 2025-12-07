import express from "express";
import {
  getUserProfile,
  getProviderProfile,
  updateUserProfile,
  updateProviderProfile,
  updateUserPhoto,
  updateProviderCertifications,
  updateProviderDocuments
} from "../controllers/profileController.js";

import upload from "../middleware/upload.js";

const router = express.Router();


// ===============================
// GET USER DATA
// ===============================
router.get("/users/:userId", getUserProfile);

// ===============================
// GET PROVIDER DATA
// ===============================
router.get("/providers/:userId", getProviderProfile);


// ===============================
// UPDATE USER (txt)
// ===============================
router.put("/users/:userId", updateUserProfile);

// ===============================
// UPDATE PROVIDER (txt)
// ===============================
router.put("/providers/:userId/profile", updateProviderProfile);




// ===============================
// UPDATE PHOTO
// ===============================
router.put(
  "/users/:userId/photo",
  upload.single("photo"),
  updateUserPhoto
);

// ===============================
// ADD CERTIFICATIONS
// ===============================
router.put(
  "/providers/:userId/certifications",
  upload.array("certifications"),
  updateProviderCertifications
);

// ===============================
// ADD DOCUMENTS
// ===============================
router.put(
  "/providers/:userId/documents",
  upload.array("documents"),
  updateProviderDocuments
);

export default router;
