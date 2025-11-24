/* import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Vérifier le token
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-motDePasse");
      next();
    } catch (error) {
      res.status(401).json({ message: "Non autorisé, token invalide" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Non autorisé, pas de token" });
  }
};

// Vérifier si l'utilisateur est admin
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Accès refusé : Admin uniquement" });
  }
};
 */

import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// ✅ Middleware pour protéger les routes (vérifier le token)
export const protect = async (req, res, next) => {
  let token;

  // Vérifier si le token existe dans les headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extraire le token
      token = req.headers.authorization.split(" ")[1];

      console.log("🔑 Token reçu:", token.substring(0, 20) + "...");

      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("✅ Token décodé:", decoded);

      // Récupérer l'utilisateur sans le mot de passe
      req.user = await User.findById(decoded.id).select("-motDePasse");

      if (!req.user) {
        console.log("❌ Utilisateur non trouvé pour ID:", decoded.id);
        return res.status(401).json({ message: "Utilisateur non trouvé" });
      }

      console.log(
        "✅ Utilisateur authentifié:",
        req.user.email,
        "- Role:",
        req.user.role
      );

      next();
    } catch (error) {
      console.error("❌ Erreur token:", error.message);
      return res.status(401).json({ message: "Non autorisé, token invalide" });
    }
  } else {
    console.log("❌ Aucun token dans les headers");
    return res.status(401).json({ message: "Non autorisé, pas de token" });
  }
};

// ✅ Middleware pour vérifier si l'utilisateur est admin
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    console.log("✅ Admin vérifié:", req.user.email);
    next();
  } else {
    console.log("❌ Accès refusé - Role:", req.user?.role);
    res.status(403).json({ message: "Accès refusé : Admin uniquement" });
  }
};

// ✅ Alias pour compatibilité (si vous utilisez adminOnly ailleurs)
export const adminOnly = admin;
