import express from "express";
import { 
  createBooking,
  getBookingById,
  acceptBooking,
  refuseBooking,
  payBooking,
  completeBooking,
  cancelBooking,
  getClientBookings,
  getProviderBookings,
  getPendingBookings,
  getUpcomingBookings,
  getCompletedBookings,
  getAllProviderBookings,
  addReview
} from "../controllers/bookingController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// 📝 POST /api/bookings - Créer une nouvelle réservation (côté client)
router.post("/", upload.array('photos', 5), createBooking);

// ⭐ IMPORTANT: Routes spécifiques AVANT les routes génériques avec paramètres

// 📋 GET /api/bookings/client/:clientId - Récupérer toutes les réservations d'un client
router.get("/client/:clientId", getClientBookings);

// 📊 GET /api/bookings/provider/:providerId/all - Toutes les réservations avec stats (MyServices)
router.get("/provider/:providerId/all", getAllProviderBookings);

// 📋 GET /api/bookings/provider/:providerId - Récupérer toutes les réservations d'un provider
router.get("/provider/:providerId", getProviderBookings);

// 🔔 GET /api/bookings/provider/:providerId/pending - Demandes en attente (GestionBook)
router.get("/provider/:providerId/pending", getPendingBookings);

// 📅 GET /api/bookings/provider/:providerId/upcoming - Services à venir (Upcoming Services)
router.get("/provider/:providerId/upcoming", getUpcomingBookings);

// ✅ GET /api/bookings/provider/:providerId/completed - Services terminés (Past Services)
router.get("/provider/:providerId/completed", getCompletedBookings);

// 📋 GET /api/bookings/:id - Récupérer une réservation spécifique (APRÈS les routes spécifiques)
router.get("/:id", getBookingById);

// ✅ PUT /api/bookings/:id/accept - Provider accepte la réservation
router.put("/:id/accept", acceptBooking);

// ❌ PUT /api/bookings/:id/refuse - Provider refuse la réservation
router.put("/:id/refuse", refuseBooking);

// 💳 PUT /api/bookings/:id/pay - Client effectue le paiement
router.put("/:id/pay", payBooking);

// ❌ PUT /api/bookings/:id/cancel - Client annule la réservation
router.put("/:id/cancel", cancelBooking);

// ✅ PUT /api/bookings/:id/complete - Provider marque le service comme terminé
router.put("/:id/complete", completeBooking);

// ⭐ POST /api/bookings/:id/review - Client laisse un avis après service terminé
router.post("/:id/review", addReview);

export default router;