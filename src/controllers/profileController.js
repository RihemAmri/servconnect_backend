import User from "../models/user.model.js";
import Provider from "../models/providerModel.js";

// ===============================
// GET PROVIDER BY USER ID
// ===============================
export const getProviderProfile = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.params.userId });
    if (!provider) return res.status(404).json({ message: "Prestataire non trouvé" });

    res.json(provider);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// UPDATE USER PROFILE (sans fichier)
// ===============================
export const updateUserProfile = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.userId,
      req.body,
      { new: true }
    );
    res.json({ message: "Utilisateur mis à jour", user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// UPDATE PROVIDER PROFILE (sans fichiers)
// ===============================
export const updateProviderProfile = async (req, res) => {
  try {
    const provider = await Provider.findOneAndUpdate(
      { user: req.params.userId },
      req.body,
      { new: true }
    );

    if (!provider) return res.status(404).json({ message: "Prestataire non trouvé" });

    res.json({ message: "Prestataire mis à jour", provider });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// 🔵 UPDATE PHOTO DE PROFIL
// ===============================
export const updateUserPhoto = async (req, res) => {
  try {
    console.log(req.file)
    if (!req.file) return res.status(400).json({ message: "Aucun fichier envoyé" });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.photo = req.file.path; 
    await user.save();

     return res.json({ message: "Photo mise à jour", photo: user.photo });
    res.json("itsabittttttttttttttttttttttttttt");
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ===============================
// 🔵 AJOUT CERTIFICATIONS
// ===============================
export const updateProviderCertifications = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.params.userId });
    if (!provider) return res.status(404).json({ message: "Prestataire non trouvé" });

    const uploaded = req.files?.map(file => file.path) || [];

    provider.certifications.push(...uploaded);
    await provider.save();

    res.json({
      message: "Certifications mises à jour",
      certifications: provider.certifications,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ===============================
// 🔵 AJOUT DOCUMENTS
// ===============================
export const updateProviderDocuments = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.params.userId });
    if (!provider) return res.status(404).json({ message: "Prestataire non trouvé" });

    const uploaded = req.files?.map(file => file.path) || [];

    provider.documents.push(...uploaded);
    await provider.save();

    res.json({
      message: "Documents mis à jour",
      documents: provider.documents,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

