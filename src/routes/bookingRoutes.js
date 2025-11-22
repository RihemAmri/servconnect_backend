import express from "express";
import { 
  createBooking,
  getBookingById,
  acceptBooking,
  refuseBooking,
  payBooking,
  completeBooking,
  getClientBookings,
  addReview
} from "../controllers/bookingController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// 📝 POST /api/bookings - Créer une nouvelle réservation (côté client)
router.post("/", upload.array('photos', 5), createBooking);

// 📋 GET /api/bookings/:id - Récupérer une réservation spécifique
router.get("/:id", getBookingById);

// 📋 GET /api/bookings/client/:clientId - Récupérer toutes les réservations d'un client
router.get("/client/:clientId", getClientBookings);

// ✅ PUT /api/bookings/:id/accept - Provider accepte la réservation
router.put("/:id/accept", acceptBooking);

// ❌ PUT /api/bookings/:id/refuse - Provider refuse la réservation
router.put("/:id/refuse", refuseBooking);

// 💳 PUT /api/bookings/:id/pay - Client effectue le paiement
router.put("/:id/pay", payBooking);

// ✅ PUT /api/bookings/:id/complete - Provider marque le service comme terminé
router.put("/:id/complete", completeBooking);

// ⭐ POST /api/bookings/:id/review - Client laisse un avis après service terminé
router.post("/:id/review", addReview);

export default router;