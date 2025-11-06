import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import debugLib from 'debug';
import dotenv from 'dotenv';
import userRoutes from './src/routes/userRoutes.js';

dotenv.config(); // ✅ charge les variables du fichier .env

const debug = debugLib('servconnect:server');
const app = express();

// 🔹 Middlewares globaux
app.use(cors());
app.use(express.json());

// 🔹 Connexion MongoDB Atlas (pas local)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ Connecté à MongoDB Atlas avec succès'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB :', err.message));

// 🔹 Routes
app.use('/api/users', userRoutes);

// 🔹 Normalisation du port
const normalizePort = val => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};
const port = normalizePort(process.env.PORT || '3130');
app.set('port', port);

// 🔹 Création du serveur HTTP
const server = http.createServer(app);

// 🔹 Gestion des erreurs serveur
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

// 🔹 Quand le serveur démarre
const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `Pipe ${addr}` : `Port ${addr.port}`;
  debug(`Listening on ${bind}`);
  console.log(`🚀 Serveur backend lancé sur ${bind}`);
};

// 🔹 Démarrage
server.on('error', onError);
server.on('listening', onListening);
server.listen(port);
