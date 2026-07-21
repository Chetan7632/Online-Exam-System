import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

// Route Imports
import authRoutes from './routes/auth.js';
import examRoutes from './routes/exams.js';
import attemptRoutes from './routes/attempts.js';
import aiRoutes from './routes/ai.js';
import requestedRoutes from './routes/requested.js';

// Load Env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Middleware
app.use(cors());
app.use(express.json());

// Initialize Database connection
await connectDB();

// Seed Database if empty
import { seedDatabase } from './config/seed.js';
await seedDatabase();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/ai', aiRoutes);

// Custom Requested Routes
app.use('/', requestedRoutes);
app.use('/api', requestedRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'AI-Based Online Examination System API is running...' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ 
    message: 'Internal server error occurred', 
    error: process.env.NODE_ENV === 'development' ? err.message : {} 
  });
});

// Start Server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
