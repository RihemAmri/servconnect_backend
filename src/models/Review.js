import mongoose from 'mongoose';
const ReviewSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Review', ReviewSchema);
