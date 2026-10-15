import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import customerRoutes from './routes/customer.routes.js';
import productRoutes from './routes/product.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import { autoSeedProductsIfEmpty } from './seedProducts.js';
import { restorePersistentData } from './utils/persistentSync.js';

// Fix Windows DNS SRV lookup for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopkart';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));

// Routes
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

// Base route for sanity check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ShopKart Customer Authentication Service is online'
  });
});

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Database Connection & Server Initialization
const connectDB = async () => {
  try {
    const isCloudDB = MONGO_URI.startsWith('mongodb+srv://') || MONGO_URI.includes('mongodb.net');
    const timeout = isCloudDB ? 2500 : 1500;
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: timeout });
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    if (MONGO_URI.startsWith('mongodb+srv://') || MONGO_URI.includes('mongodb.net')) {
      console.log('MongoDB Atlas connection skipped (check credentials in .env). Switching to local embedded database...');
    }
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri('shopkart');
      await mongoose.connect(uri);
      console.log('Connected to Embedded Database successfully');
    } catch (memErr) {
      console.error('Database connection error:', memErr.message);
      process.exit(1);
    }
  }

  // 1. Auto-seed sample products if empty
  await autoSeedProductsIfEmpty();

  // 2. Restore persistent saved customer accounts and orders from disk
  await restorePersistentData();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is occupied by an existing process. Please stop existing node processes.`);
    } else {
      console.error('Server error:', err);
    }
  });
};

connectDB();

export default app;
