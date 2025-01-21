import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['customer', 'agent'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  messages: [messageSchema],
  lastMessage: {
    text: String,
    timestamp: Date,
    unread: {
      type: Boolean,
      default: true
    }
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

conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;