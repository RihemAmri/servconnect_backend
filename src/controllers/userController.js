import User from "../models/user.model.js";
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

    // vérifier si email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // créer un user
    const newUser = new User({
      nom,
      prenom,
      email,
      motDePasse: hashedPassword,
      telephone,
      adresse,
      role,
    });
    console.log("mizilt ma3maltich user jdid ");
    const savedUser = await newUser.save();
    console.log("Utilisateur enregistré :", savedUser);
    // si prestataire, créer aussi le Provider
    if (role === "prestataire") {
      const newProvider = new Provider({
        user: savedUser._id,
        metier,
        description,
        experience,
      });
      await newProvider.save();
    }
    console.log("tsajillll ");
    res
      .status(201)
      .json({ message: "Utilisateur créé avec succès", user: savedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
