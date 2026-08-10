import mongoose from 'mongoose';

const apiUsageSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
    index: true,
  },
  provider: {
    type: String,
    required: true,
  },
  operation: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true
});

apiUsageSchema.index({ month: 1, provider: 1, operation: 1 }, { unique: true });

export const ApiUsage = mongoose.model('ApiUsage', apiUsageSchema);
