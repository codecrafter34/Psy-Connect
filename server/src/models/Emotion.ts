import mongoose from 'mongoose';

const emotionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rawEmotion: {
    type: String,
    required: true,
  },
  normalizedEmotion: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
  provider: {
    type: String,
    required: true,
    default: 'aws-rekognition',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true // This will automatically add createdAt and updatedAt
});

// Index for fast lookup of daily limits and user records
emotionSchema.index({ userId: 1, timestamp: -1 });

export const Emotion = mongoose.model('Emotion', emotionSchema);
