import express from 'express';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import dotenv from 'dotenv';
import mapRoutes from './routes/mapRoutes.js';
import profileRoutes from './routes/profileRoutes.js ';

dotenv.config();
const app = express();
// 🔹 Connexion à MongoDB
connectDB();
// 🔹 Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 🔹 En-têtes CORS personnalisés
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, authorization, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

// 🔹 Routes principales
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/profile', profileRoutes);

// 📊 Route de test API
app.get('/api/test', (req, res) => {
  res.json({ message: 'API fonctionne correctement !' });
});

export default app;