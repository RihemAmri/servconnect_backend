import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import mapRoutes from "./routes/mapRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import chatbotRoute from "./routes/chatbotRoutes.js"
import stripeRoutes from "./routes/stripeRoutes.js";

const app = express();

// Connexion MongoDB
connectDB();

// ⚠️ Webhook Stripe DOIT être AVANT express.json() pour recevoir le raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers
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

// Routing
app.use("/api/users", userRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chatbot", chatbotRoute);
app.use("/api/stripe", stripeRoutes);

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API OK" });
});

export default app;
