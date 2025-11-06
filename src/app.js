const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();
const app = express();
app.use('/api/users', userRoutes);
// 🔹 Connecter à la base de données MongoDB
connectDB();
app.use(cors());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin,authorization, X-Requested-With, Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
module.exports = app;