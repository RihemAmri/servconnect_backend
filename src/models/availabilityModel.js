import mongoose from "mongoose";

const AvailabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  timeSlots: [
    {
      start: { type: String, required: true },  
      end: { type: String, required: true },    
    },
  ],
});

export default AvailabilitySchema;
