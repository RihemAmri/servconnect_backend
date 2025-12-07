import express from "express";
import {
  registerProvider,
  getProviders,
  getProviderById,
  updateProvider,
  updateAvailability,
  getProviderBookings,
  getProviderStats,
  getProviderRevenueChart,
  verifyDocuments,
  resubmitDocuments,
  getMyDocumentsStatus,
  uploadSingleDocument,
} from "../controllers/providerController.js";
import upload from "../middleware/upload.js";
import { uploadProviderDocs, uploadSingleDoc } from "../middleware/upload.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// ==========================================
// 🌍 ROUTES PUBLIQUES (sans authentification)
// ==========================================
router.get("/", getProviders); // GET /api/providers
router.post("/register", upload.array("documents", 5), registerProvider); // POST /api/providers/register

// ==========================================
// 🔒 ROUTES PROTÉGÉES (avec authentification)
// ==========================================

// Routes "me" DOIVENT être AVANT les routes /:id
router.get("/me/documents-status", protect, getMyDocumentsStatus);
router.post("/:id/resubmit-documents", protect, uploadProviderDocs, resubmitDocuments);
router.post("/:id/upload-document", protect, uploadSingleDoc, uploadSingleDocument);

// Routes de modification protégées
router.put("/:id", protect, upload.array("documents", 5), updateProvider);
router.put("/:id/availability", protect, updateAvailability);
router.put("/:id/verify", protect, verifyDocuments);

// Routes publiques avec :id (APRÈS les routes protégées spécifiques)
router.get("/:id", getProviderById); // GET /api/providers/:id
router.get("/:id/stats", getProviderStats); // GET /api/providers/:id/stats
router.get("/:id/revenue-chart", getProviderRevenueChart); // GET /api/providers/:id/revenue-chart
router.get("/:id/bookings", getProviderBookings); // GET /api/providers/:id/bookings

export default router;
