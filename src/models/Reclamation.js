import mongoose from "mongoose";

const ReclamationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sujet: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ["en attente", "répondu"],
    default: "en attente",
  },
  reponse: { type: String, default: null },
  dateCreation: { type: Date, default: Date.now },
});

export default mongoose.model("Reclamation", ReclamationSchema);
