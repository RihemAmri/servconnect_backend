import express from 'express';
import cors from 'cors';
import http from 'http';
import debugLib from 'debug';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import userRoutes from './src/routes/userRoutes.js';
import profileRoutes from './src/routes/profileRoutes.js';




dotenv.config(); // charge .env

const debug = debugLib('servconnect:server');
const app = express();

// Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// CORS Headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, Authorization, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  next();
});

// Connexion MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connecté à MongoDB Atlas"))
  .catch(err => console.error("❌ Erreur de connexion MongoDB :", err.message));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);

// Normalisation du port
const normalizePort = val => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};
const port = normalizePort(process.env.PORT || '3130');
app.set('port', port);

const server = http.createServer(app);

// Gestion des erreurs
const onError = error => {
  if (error.syscall !== 'listen') throw error;
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} nécessite des privilèges élevés`);
      process.exit(1);
    case 'EADDRINUSE':
      console.error(`${bind} est déjà utilisé`);
      process.exit(1);
    default:
      throw error;
  }
};

// Lancement du serveur
const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `Pipe ${addr}` : `Port ${addr.port}`;
  debug(`Listening on ${bind}`);
  console.log(`🚀 Serveur backend lancé sur ${bind}`);
};

server.on('error', onError);
server.on('listening', onListening);
server.listen(port);
