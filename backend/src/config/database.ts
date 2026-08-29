import mongoose from 'mongoose';
import logger from '../utils/logger';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in environment');
  await mongoose.connect(uri);
  logger.info('Connected to MongoDB');
};

export default mongoose;
