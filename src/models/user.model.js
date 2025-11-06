import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  telephone: { type: String },
  adresse: { type: String },
  photo: { type: String }, // lien Cloudinary
  role: {
    type: String,
    enum: ['client', 'prestataire', 'admin'],
    required: true
  },
  dateInscription: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
