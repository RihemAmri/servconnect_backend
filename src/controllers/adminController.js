import User from "../models/user.model.js";
import Provider from "../models/providerModel.js";

// ==========================================
// 👥 GESTION DES UTILISATEURS
// ==========================================

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

// ==========================================
// 🔧 GESTION DES PRESTATAIRES
// ==========================================

// 📊 Liste tous les prestataires avec filtres
export const getAllProviders = async (req, res) => {
  try {
    const { statut, ville, metier } = req.query;

    // Récupérer les providers avec populate
    const providers = await Provider.find()
      .populate({
        path: "user",
        select: "-motDePasse",
      })
      .sort({ createdAt: -1 });

    // Filtrer et formatter les données
    let result = providers
      .filter((provider) => provider.user) // Filtrer les providers sans user
      .map((provider) => {
        const user = provider.user;

        // Extraire la ville depuis l'adresse
        let ville = "Non renseigné";
        if (user.adresse) {
          if (user.adresse.street) {
            // Extraire la ville depuis street (ex: "123 Rue Example, Tunis")
            const addressParts = user.adresse.street.split(",");
            ville =
              addressParts.length > 1
                ? addressParts[addressParts.length - 1].trim()
                : user.adresse.street;
          }
        }

        return {
          _id: provider._id,
          userId: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: user.telephone,
          photo: user.photo,
          metier: provider.metier,
          ville: ville,
          description: provider.description,
          experience: provider.experience,
          statut: provider.isVerified ? "actif" : "en_attente",
          noteGenerale: provider.noteGenerale || 0,
          nombreAvis: provider.nombreAvis || 0,
          nombreMissions: 0, // À compléter avec le modèle Mission
          dateInscription: user.dateInscription || user.createdAt,
          verificationDocuments: provider.verificationDocuments || [],
          documents: provider.documents || [],
          certifications: provider.certifications || [],
        };
      });

    // Appliquer les filtres
    if (statut && statut !== "tous") {
      result = result.filter((p) => p.statut === statut);
    }

    if (ville && ville !== "toutes") {
      result = result.filter((p) =>
        p.ville.toLowerCase().includes(ville.toLowerCase())
      );
    }

    if (metier) {
      result = result.filter((p) =>
        p.metier.toLowerCase().includes(metier.toLowerCase())
      );
    }

    res.json(result);
  } catch (error) {
    console.error("Erreur getAllProviders:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📄 Détails d'un prestataire
export const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await Provider.findById(id).populate({
      path: "user",
      select: "-motDePasse",
    });

    if (!provider) {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }

    if (!provider.user) {
      return res
        .status(404)
        .json({ message: "Utilisateur associé introuvable" });
    }

    const user = provider.user;

    // Extraire la ville
    let ville = "Non renseigné";
    if (user.adresse && user.adresse.street) {
      const addressParts = user.adresse.street.split(",");
      ville =
        addressParts.length > 1
          ? addressParts[addressParts.length - 1].trim()
          : user.adresse.street;
    }

    res.json({
      _id: provider._id,
      userId: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      photo: user.photo,
      metier: provider.metier,
      ville: ville,
      adresse: user.adresse,
      description: provider.description,
      experience: provider.experience,
      certifications: provider.certifications || [],
      documents: provider.documents || [],
      verificationDocuments: provider.verificationDocuments || [],
      statut: provider.isVerified ? "actif" : "en_attente",
      noteGenerale: provider.noteGenerale || 0,
      nombreAvis: provider.nombreAvis || 0,
      nombreMissions: 0,
      dateInscription: user.dateInscription || user.createdAt,
      disponibilite: provider.disponibilite || [],
    });
  } catch (error) {
    console.error("Erreur getProviderById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ VALIDER un prestataire
export const validateProvider = async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }

    // Valider tous les documents
    if (
      provider.verificationDocuments &&
      provider.verificationDocuments.length > 0
    ) {
      provider.verificationDocuments.forEach((doc) => {
        doc.isVerified = true;
        doc.status = "verified";
      });
    }

    provider.isVerified = true;
    await provider.save();

    // Envoyer un email de confirmation (optionnel)
    // await sendValidationEmail(provider.user);

    res.json({
      message: "Prestataire validé avec succès",
      provider,
    });
  } catch (error) {
    console.error("Erreur validateProvider:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ❌ REFUSER un prestataire
export const rejectProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { motif, documentIds } = req.body;

    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }

    if (
      !provider.verificationDocuments ||
      provider.verificationDocuments.length === 0
    ) {
      return res.status(400).json({ message: "Aucun document à rejeter" });
    }

    // Si des documents spécifiques sont rejetés
    if (documentIds && documentIds.length > 0) {
      provider.verificationDocuments.forEach((doc) => {
        if (documentIds.includes(doc._id.toString())) {
          doc.status = "rejected";
          doc.rejectionReason = motif;
          doc.isVerified = false;
        }
      });
    } else {
      // Rejeter tous les documents
      provider.verificationDocuments.forEach((doc) => {
        doc.status = "rejected";
        doc.rejectionReason = motif;
        doc.isVerified = false;
      });
    }

    provider.isVerified = false;
    await provider.save();

    // Envoyer un email de notification (optionnel)
    // await sendRejectionEmail(provider.user, motif);

    res.json({
      message: "Prestataire refusé",
      provider,
    });
  } catch (error) {
    console.error("Erreur rejectProvider:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 🔄 VALIDER/REJETER un document spécifique
// 🔄 VALIDER/REJETER un document spécifique
export const updateDocumentStatus = async (req, res) => {
  try {
    const { id, documentId } = req.params;
    const { status, rejectionReason } = req.body;

    console.log(`📄 Mise à jour document ${documentId} → ${status}`);

    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }

    const document = provider.verificationDocuments.id(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document introuvable" });
    }

    // Mettre à jour le statut du document
    document.status = status;

    if (status === "rejected") {
      document.rejectionReason = rejectionReason;
      document.isVerified = false;

      // ✅ AUTOMATIQUEMENT REFUSER LE PRESTATAIRE
      provider.isVerified = false;
      console.log(
        `❌ Prestataire ${provider._id} automatiquement refusé car document rejeté`
      );
    }

    if (status === "verified") {
      document.isVerified = true;
      document.rejectionReason = undefined;
    }

    // Vérifier si tous les documents sont validés
    const allVerified = provider.verificationDocuments.every(
      (doc) => doc.status === "verified"
    );

    const hasRejected = provider.verificationDocuments.some(
      (doc) => doc.status === "rejected"
    );

    // ✅ Logique de statut du prestataire
    if (hasRejected) {
      // Si AU MOINS UN document est rejeté → prestataire refusé
      provider.isVerified = false;
      console.log(
        `❌ Prestataire ${provider._id} → statut: refusé (documents rejetés)`
      );
    } else if (allVerified && provider.verificationDocuments.length > 0) {
      // Si TOUS les documents sont vérifiés → prestataire actif
      provider.isVerified = true;
      console.log(
        `✅ Prestataire ${provider._id} → statut: actif (tous docs validés)`
      );
    } else {
      // Sinon → en attente
      provider.isVerified = false;
      console.log(`⏳ Prestataire ${provider._id} → statut: en attente`);
    }

    await provider.save();

    res.json({
      message: "Document mis à jour",
      provider,
    });
  } catch (error) {
    console.error("Erreur updateDocumentStatus:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 🗑️ SUPPRIMER un prestataire
export const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }

    // Supprimer l'utilisateur associé
    await User.findByIdAndDelete(provider.user);

    // Supprimer le provider
    await Provider.findByIdAndDelete(id);

    res.json({ message: "Prestataire supprimé avec succès" });
  } catch (error) {
    console.error("Erreur deleteProvider:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
