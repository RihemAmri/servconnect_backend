import User from "../models/user.model.js";
import Provider from "../models/providerModel.js";

// 📌 Récupérer tous les utilisateurs avec filtres
export const getAllUsers = async (req, res) => {
  try {
    const { search, role, statut, page = 1, limit = 10 } = req.query;

    // Construction du filtre
    let filter = {};

    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: "i" } },
        { prenom: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { telephone: { $regex: search, $options: "i" } },
      ];
    }

    if (role && role !== "tous") {
      filter.role = role;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .select("-motDePasse")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ dateInscription: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Erreur getAllUsers:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📌 Récupérer les détails d'un utilisateur
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-motDePasse");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    let providerData = null;
    if (user.role === "prestataire") {
      providerData = await Provider.findOne({ user: id });
    }

    // TODO: Ajouter historique des réservations et avis plus tard
    res.status(200).json({
      user,
      provider: providerData,
      // reservations: [],
      // avis: []
    });
  } catch (error) {
    console.error("Erreur getUserDetails:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📌 Modifier un utilisateur
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, telephone, adresse, role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { nom, prenom, telephone, adresse, role },
      { new: true, runValidators: true }
    ).select("-motDePasse");

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.status(200).json({
      message: "Utilisateur modifié avec succès",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erreur updateUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📌 Suspendre un utilisateur
export const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Ajouter un champ "isSuspended" dans ton modèle User
    const user = await User.findByIdAndUpdate(
      id,
      { isSuspended: true },
      { new: true }
    ).select("-motDePasse");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.status(200).json({
      message: "Utilisateur suspendu",
      user,
    });
  } catch (error) {
    console.error("Erreur suspendUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📌 Supprimer un utilisateur
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Si c'est un prestataire, supprimer aussi son profil Provider
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    if (user.role === "prestataire") {
      await Provider.findOneAndDelete({ user: id });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "Utilisateur supprimé" });
  } catch (error) {
    console.error("Erreur deleteUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
