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
  price: { type: Number },

  status: {
    type: String,
    enum: ["pending", "accepted", "refused", "completed"],
    default: "pending",
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Booking", BookingSchema);
