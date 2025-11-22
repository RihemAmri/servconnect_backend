import mongoose from 'mongoose';

const AdresseSchema = new mongoose.Schema({
  street: { type: String, required: true },
  lat: { type: Number },
  lng: { type: Number }
}, { _id: false });
const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  photo: { type: String }, // lien Cloudinary
  telephone: { type: String },
  adresse: { type: AdresseSchema, required: true },
  photo: { type: String }, // lien Cloudinary
  role: {
    type: String,
    enum: ['client', 'prestataire', 'admin'],
    required: true
  },
  dateInscription: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
