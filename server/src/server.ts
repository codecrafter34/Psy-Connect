import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import emotionRoutes from './routes/emotions';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB later before app.listen

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration - critical for cookie-based auth
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true, // Allow cookies to be sent across origins
}));

// Routes
app.use('/api/health', (req, res) => { res.status(200).json({ status: 'ok' }); });
app.use('/api/auth', authRoutes);
app.use('/api/emotions', emotionRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
});
