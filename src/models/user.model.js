import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  photo: { type: String }, // lien Cloudinary
  noteGenerale: { type: Number, default: 0 },
  nombreAvis: { type: Number, default: 0 },
  telephone: { type: String },
  adresse: {
    street: { type: String, default: "Non spécifiée" },
    lat: { type: Number },
    lng: { type: Number }
  },
  photo: { type: String }, // lien Cloudinary
  role: {
    type: String,
    enum: ['client', 'prestataire', 'admin'],
    required: true
  },
  dateInscription: { type: Date, default: Date.now },
  resetPasswordToken: { type: String },
resetPasswordExpire: { type: Date }

});

export default mongoose.model('User', UserSchema);
