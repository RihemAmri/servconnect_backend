import mongoose from "mongoose";

const AdresseSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);
const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  noteGenerale: { type: Number, default: 0 },
  nombreAvis: { type: Number, default: 0 },
  telephone: { type: String },
  adresse: { type: AdresseSchema, required: true },
  photo: { type: String, default: 'https://via.placeholder.com/150/667eea/ffffff?text=User' }, // lien Cloudinary avec image par défaut
  role: {
    type: String,
    enum: ["client", "prestataire", "admin"],
    required: true,
  },
  dateInscription: { type: Date, default: Date.now },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  isSuspended: { type: Boolean, default: false },
});

export default mongoose.model("User", UserSchema);
