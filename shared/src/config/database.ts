import mongoose from 'mongoose';

export async function connectToDatabase() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/webradio';
    console.log('Connecting to MongoDB:', uri);
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/webradio'
    );
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
