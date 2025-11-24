import express from "express";
import {
  registerProvider,
  getProviders,
  getProviderById,
  updateProvider,
  updateAvailability,
  getProviderBookings,
  getProviderStats,
  verifyDocuments,
  resubmitDocuments,
  getMyDocumentsStatus,
} from "../controllers/providerController.js";
import upload from "../middleware/upload.js";
import { uploadProviderDocs } from "../middleware/upload.js";
import { protect } from "../middleware/auth.middleware.js"; // ✅ IMPORT

const router = express.Router();

// ==========================================
// 🌍 ROUTES PUBLIQUES (sans authentification)
// ==========================================
router.get("/", getProviders); // GET /api/providers
router.get("/:id", getProviderById); // GET /api/providers/:id
router.get("/:id/stats", getProviderStats); // GET /api/providers/:id/stats
router.get("/:id/bookings", getProviderBookings); // GET /api/providers/:id/bookings
router.post("/register", upload.array("documents", 5), registerProvider); // POST /api/providers/register

// ==========================================
// 🔒 ROUTES PROTÉGÉES (avec authentification)
// ==========================================
router.use(protect); // ✅ Toutes les routes suivantes nécessitent l'authentification

// Routes du prestataire connecté
router.get("/me/documents-status", getMyDocumentsStatus); // ✅ DOIT être AVANT /:id
router.post("/:id/resubmit-documents", uploadProviderDocs, resubmitDocuments);

// Routes de modification
router.put("/:id", upload.array("documents", 5), updateProvider);
router.put("/:id/availability", updateAvailability);
router.put("/:id/verify", verifyDocuments);

export default router;
