/*import User from "../models/user.model.js";
import Provider from "../models/providerModel.js";
import bcrypt from "bcryptjs";

export const registerUser = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      motDePasse,
      telephone,
      adresse,
      role,
      metier,
      description,
      experience,
    } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Récupérer le lien Cloudinary si image envoyée
    const photoUrl = req.file ? req.file.path : null;
    console.log("Photo URL:", photoUrl);

    // Créer l'utilisateur
    const newUser = new User({
      nom,
      prenom,
      email,
      motDePasse: hashedPassword,
      telephone,
      adresse,
      role,
      photo: photoUrl, // lien Cloudinary ici
    });

    const savedUser = await newUser.save();

    // Si prestataire, créer aussi le Provider
    if (role === "prestataire") {
      const newProvider = new Provider({
        user: savedUser._id,
        metier,
        description,
        experience,
      });
      await newProvider.save();
    }

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: savedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};*/

import User from "../models/user.model.js";
import Provider from "../models/providerModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 📌 Inscription client simple
export const registerUser = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, telephone, adresse, role } =
      req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Upload photo (si envoyée)
    const photoUrl = req.file ? req.file.path : null;

    // Créer le client
    const newUser = new User({
      nom,
      prenom,
      email,
      motDePasse: hashedPassword,
      telephone,
      adresse,
      role: role || "client",
      photo: photoUrl,
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "Client créé avec succès",
      user: savedUser,
    });
  } catch (error) {
    console.error("Erreur registerUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📌 Inscription prestataire (avec fichiers Cloudinary)
export const registerProvider = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      motDePasse,
      telephone,
      adresse,
      metier,
      description,
      experience,
    } = req.body;

    // Vérification email unique
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Récupération des fichiers uploadés
    const photoUrl = req.files?.photo?.[0]?.path || null;
    const certificationsUrls =
      req.files?.certifications?.map((f) => f.path) || [];
    const documentsUrls = req.files?.documents?.map((f) => f.path) || [];

    // Création du user
    const newUser = new User({
      nom,
      prenom,
      email,
      motDePasse: hashedPassword,
      telephone,
      adresse,
      role: "prestataire",
      photo: photoUrl,
    });

    const savedUser = await newUser.save();

    // Création du provider lié
    const newProvider = new Provider({
      user: savedUser._id,
      metier,
      description,
      experience,
      certifications: certificationsUrls,
      documents: documentsUrls,
    });

    await newProvider.save();

    res.status(201).json({
      message: "Prestataire inscrit avec succès",
      user: savedUser,
      provider: newProvider,
    });
  } catch (error) {
    console.error("Erreur registerProvider:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
export const loginUser = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier mot de passe
    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    // Créer token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    // Si prestataire, récupérer ses infos Provider
    let providerData = null;
    if (user.role === "prestataire") {
      providerData = await Provider.findOne({ user: user._id });
    }

    res.status(200).json({
      message: "Connexion réussie",
      user,
      provider: providerData,
      token,
    });
  } catch (error) {
    console.error("Erreur loginUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
