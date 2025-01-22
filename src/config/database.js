import mongoose from 'mongoose';
import { PROCESS } from '../utils/constants';

const connectDB = async () => {
  try {
    const uri = PROCESS.env.MONGODB_URI;
    const options = {
      user: PROCESS.env.MONGODB_USER,
      pass: PROCESS.env.MONGODB_PASSWORD,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    await mongoose.connect(uri, options);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export default connectDB;