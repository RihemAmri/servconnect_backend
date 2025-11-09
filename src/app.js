const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes'); // ✅ import manquant
require('dotenv').config();

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
    "Origin,authorization, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  next();
});

// 🔹 Routes principales
app.use('/api/users', userRoutes); // ✅ ici après les middlewares

// (Optionnel) Pour Angular build
// const __dirname1 = path.resolve();
// app.use(express.static(path.join(__dirname1, '/frontend/dist')));
// app.get('*', (req, res) =>
//   res.sendFile(path.resolve(__dirname1, 'frontend', 'dist', 'index.html'))
// );

module.exports = app;
