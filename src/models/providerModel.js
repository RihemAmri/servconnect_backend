import mongoose from 'mongoose';

const AvailabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: [
      'monday', 'tuesday', 'wednesday', 'thursday',
      'friday', 'saturday', 'sunday'
    ],
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  timeSlots: [
    {
      start: { type: String, required: true }, // "HH:MM"
      end: { type: String, required: true }     // "HH:MM"
    }
  ]
});

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
  documents: [{ type: String }], // si tu veux lier Cloudinary URLs plus tard
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    }
  ],
  disponibilite: [AvailabilitySchema],
  verificationDocuments: [{
    documentType: {
      type: String,
      enum: ['id', 'certificate', 'license', 'other'],
      required: true
    },
    path: {
      type: String,
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    rejectionReason: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

export default mongoose.model('Provider', ProviderSchema);