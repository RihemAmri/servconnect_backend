import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Provider",
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  date: { type: Date, required: true },
  service: { type: String, required: true },
  cause: { type: String, required: true },

  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },

  attachments: [{ type: String }],

  // 💰 Prix proposé par le provider (après consultation)
  proposedPrice: { type: Number },

  // 🕒 Durée estimée en minutes
  estimatedDuration: { type: Number },

  // 📝 Notes du provider (ex: "Besoin de pièces supplémentaires")
  providerNotes: { type: String },

  // 💳 Statut du paiement
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "refunded"],
    default: "pending"
  },

  // 💳 ID du Payment Intent Stripe
  paymentIntentId: { type: String },

  // 💳 Date du paiement
  paidAt: { type: Date },

  // 🔄 Statut de la réservation
  status: {
    type: String,
    enum: ["pending", "accepted", "refused", "paid", "completed", "cancelled"],
    default: "pending",
  },

  // 🚫 Raison du refus (si refusé)
  refusalReason: { type: String },

  // ⏰ Timestamps
  createdAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  completedAt: { type: Date }
});

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
