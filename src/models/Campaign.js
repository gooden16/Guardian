import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'scheduled', 'completed'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['email', 'social'],
    required: true
  },
  audience: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  spent: {
    type: Number,
    default: 0
  },
  metrics: {
    sent: Number,
    opened: Number,
    clicked: Number,
    converted: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

campaignSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;