import mongoose from "mongoose";
const bookingSchema = new mongoose.Schema({
  provider: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Provider", 
    required: true 
  },

  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  // 📅 Date + Heure choisies par le client
  date: { type: Date, required: true },
  time: { type: String, required: true }, // Format: "HH:MM"

  // 🛠 Service choisi (ex: plomberie, électricité...)
  service: { type: String, required: true },

  // 📝 Description du problème
  cause: { type: String, required: true },

  // 🚨 Urgence du service
  urgency: {
    type: String,
    enum: ["low", "normal", "high"],
    default: "normal"
  },

  // 🗺 Localisation exacte (OpenStreetMap)
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },

  // 📸 Photos envoyées (Cloudinary)
  attachments: [{ type: String }],

  // 💰 Prix du service (libre ou calculé plus tard)
  price: { type: Number },

  // 🔄 Statut
  status: {
    type: String,
    enum: ["pending", "accepted", "refused", "completed"],
    default: "pending"
  },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Booking", bookingSchema);
