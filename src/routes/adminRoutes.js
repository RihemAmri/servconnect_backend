import express from "express";
import {
  getAllUsers,
  getUserDetails,
  updateUser,
  suspendUser,
  deleteUser,
  getAllProviders,
  getProviderById,
  validateProvider,
  rejectProvider,
  updateDocumentStatus,
  deleteProvider,
} from "../controllers/adminController.js";
import { protect, admin } from "../middleware/auth.middleware.js"; // middleware d'authentification

const router = express.Router();

// 🔒 Toutes ces routes nécessitent un admin authentifié
router.use(protect, admin);

router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);
router.put("/users/:id", updateUser);
router.patch("/users/:id/suspend", suspendUser);
router.delete("/users/:id", deleteUser);
router.get("/providers", getAllProviders);
router.get("/providers/:id", getProviderById);
router.patch("/providers/:id/validate", validateProvider);
router.patch("/providers/:id/reject", rejectProvider);
router.patch("/providers/:id/documents/:documentId", updateDocumentStatus);
router.delete("/providers/:id", deleteProvider);

export default router;
