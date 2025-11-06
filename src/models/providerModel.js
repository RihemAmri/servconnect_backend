import mongoose from 'mongoose';

const ProviderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // chaque prestataire est lié à un user
  },
  metier: { type: String, required: true },
  description: { type: String },
  experience: { type: Number },
  certifications: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  noteGenerale: { type: Number, default: 0 },
  nombreAvis: { type: Number, default: 0 },
  documents: [{ type: String }] // si tu veux lier Cloudinary URLs plus tard
});

export default mongoose.model('Provider', ProviderSchema);