import Reclamation from "../models/Reclamation.js";
import { sendEmail } from "../config/emailService.js";
import User from "../models/user.model.js";

// Ajouter une réclamation
export const addReclamation = async (req, res) => {
  try {
    const { userId, sujet, description } = req.body;

    if (!userId || !sujet || !description)
      return res.status(400).json({ message: "Tous les champs sont requis" });
    
    const user = await User.findById(userId);

    const newRec = new Reclamation({
      user: userId,
      sujet,
      description,
      status: "en attente"
    });

    await newRec.save();

    /** 🔔 Email 1 → envoyée au client */
    await sendEmail(
        user.email,
        "Votre réclamation a été reçue ✔️",
        `
          <p>Madame, Monsieur ${user.nom} ${user.prenom},</p>

          <p>Nous vous informons que votre réclamation a bien été enregistrée par nos services.</p>

          <p><strong>Sujet :</strong> ${sujet}</p>

          <p>Notre équipe prendra connaissance de votre demande et reviendra vers vous dans les plus brefs délais.</p>

          <p>Cordialement,<br>
          — L'équipe ServConnect</p>
        `
      );

    /** 🔔 Email 2 → envoyée à l’ADMIN */
    await sendEmail(
      process.env.ADMIN_EMAIL,
      "Nouvelle réclamation reçue ⚠️",
      `
        <p>Une nouvelle réclamation a été déposée par :</p>
        <p><strong>${user.prenom} ${user.nom}</strong></p>
        <p><strong>Sujet :</strong> ${sujet}</p>
        <p>Veuillez consulter la plateforme pour la traiter.</p>
      `
    );

    res.status(201).json(newRec);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// Récupérer les réclamations d’un utilisateur
export const getUserReclamations = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId requis" });

    const recs = await Reclamation.find({ user: userId })
      .sort({ dateCreation: -1 }); // <-- tri décroissant
    res.json(recs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Récupérer toutes les réclamations (pour admin)
export const getAllReclamations = async (req, res) => {
  try {
    const recs = await Reclamation.find()
      .populate("user", "nom prenom email role")
      .sort({ dateCreation: -1 }); // <-- tri décroissant
    res.json(recs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Mettre à jour la réponse / status (admin)
export const respondReclamation = async (req, res) => {
  try {
    const { status, reponse } = req.body;
    const rec = await Reclamation.findByIdAndUpdate(
      req.params.id,
      { status, reponse },
      { new: true }
    ).populate("user", "nom prenom email role");
    if (!rec) return res.status(404).json({ message: "Réclamation introuvable" });

     /** 🔔 Email → envoyé à l'utilisateur */
   await sendEmail(
  rec.user.email,
  "Votre réclamation a été traitée ✔️",
  `
    <p>Madame, Monsieur ${rec.user.prenom} ${rec.user.nom},</p>

    <p>Nous vous informons que votre réclamation a été traitée.</p>

    <p><strong>Réponse de notre équipe :</strong></p>
    <p>${reponse}</p>

    <p>Vous pouvez consulter tous les détails directement sur votre espace personnel sur l'application ServConnect.</p>

    <p>Cordialement,<br>
    — L'équipe ServConnect</p>
  `
);



    res.json({ message: "Réclamation mise à jour", reclamation: rec });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
