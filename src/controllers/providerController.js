import Provider from "../models/providerModel.js";
import User from "../models/user.model.js";
import Booking from "../models/bookingModel.js";
import Review from "../models/Review.js";

// ===== REGISTER PROVIDER =====
export const registerProvider = async (req, res) => {
  try {
    const { userId, metier, description, experience, certifications } =
      req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si l'utilisateur n'est pas déjà provider
    const existingProvider = await Provider.findOne({ user: userId });
    if (existingProvider) {
      return res
        .status(400)
        .json({ message: "Cet utilisateur est déjà un prestataire" });
    }

    // Traiter les documents de vérification si des fichiers sont uploadés
    const verificationDocuments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        verificationDocuments.push({
          documentType: file.fieldname, // Le type sera dans le fieldname
          path: file.path,
          status: "pending",
        });
      });
    }

    // Créer le provider
    const newProvider = new Provider({
      user: userId,
      metier,
      description,
      experience: parseInt(experience) || 0,
      certifications: certifications ? certifications.split(",") : [],
      verificationDocuments,
    });

    await newProvider.save();

    res.status(201).json({
      message: "Prestataire créé avec succès",
      provider: newProvider,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ===== GET ALL PROVIDERS WITH FILTERS =====
export const getProviders = async (req, res) => {
  try {
    const {
      category,
      location,
      minRating = 0,
      maxPrice,
      sortBy = "noteGenerale",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    // Construction du filtre
    const filter = {};

    if (category && category !== "Tous") {
      filter.metier = new RegExp(category, "i");
    }

    if (minRating) {
      filter.noteGenerale = { $gte: parseFloat(minRating) };
    }

    // Options de pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Récupération des providers
    const providers = await Provider.find(filter)
      .populate("user", "nom prenom email telephone adresse photo")
      .populate("reviews")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalProviders = await Provider.countDocuments(filter);
    
    res.status(200).json({
      providers,
      totalPages: Math.ceil(totalProviders / parseInt(limit)),
      currentPage: parseInt(page),
      totalProviders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ===== GET PROVIDER BY ID =====
export const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by provider ID first, then by user ID
    let provider = await Provider.findById(id)
      .populate("user", "nom prenom email telephone adresse photo")
      .populate({
        path: "reviews",
        populate: {
          path: "client",
          select: "nom prenom",
        },
      });

    // If not found, try to find by user ID
    if (!provider) {
      provider = await Provider.findOne({ user: id })
        .populate("user", "nom prenom email telephone adresse photo")
        .populate({
          path: "reviews",
          populate: {
            path: "client",
            select: "nom prenom",
          },
        });
    }

    if (!provider) {
      return res.status(404).json({ message: "Prestataire non trouvé" });
    }

    res.status(200).json({ provider });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ===== UPDATE PROVIDER =====
export const updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Si de nouveaux documents sont uploadés
    if (req.files && req.files.length > 0) {
      const newVerificationDocuments = req.files.map((file) => ({
        documentType: file.fieldname,
        path: file.path,
        status: "pending",
      }));

      const provider = await Provider.findById(id);
      if (provider) {
        provider.verificationDocuments.push(...newVerificationDocuments);
        updates.verificationDocuments = provider.verificationDocuments;
      }
    }

    const updatedProvider = await Provider.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("user", "nom prenom email telephone adresse photo");

    if (!updatedProvider) {
      return res.status(404).json({ message: "Prestataire non trouvé" });
    }

    res.status(200).json({
      message: "Prestataire mis à jour avec succès",
      provider: updatedProvider,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ===== UPDATE AVAILABILITY =====
export const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { disponibilite } = req.body;

    const provider = await Provider.findByIdAndUpdate(
      id,
      { disponibilite },
      { new: true, runValidators: true }
    );

    if (!provider) {
      return res.status(404).json({ message: "Prestataire non trouvé" });
    }

    res.status(200).json({
      message: "Disponibilités mises à jour avec succès",
      disponibilite: provider.disponibilite,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ===== GET PROVIDER BOOKINGS =====
export const getProviderBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Construction du filtre
    const filter = { provider: id };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate("client", "nom prenom email telephone")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBookings = await Booking.countDocuments(filter);

    res.status(200).json({
      bookings,
      totalPages: Math.ceil(totalBookings / parseInt(limit)),
      currentPage: parseInt(page),
      totalBookings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ===== GET PROVIDER STATS (DASHBOARD) =====
export const getProviderStats = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📊 getProviderStats appelé avec id:', id);

    // Trouver le provider - essayer d'abord par user ID, puis par provider ID
    let provider = await Provider.findOne({ user: id });
    
    if (!provider) {
      // Essayer de trouver par provider ID directement
      provider = await Provider.findById(id);
    }
    
    if (!provider) {
      console.log('❌ Provider non trouvé pour id:', id);
      return res.status(404).json({ success: false, message: "Prestataire non trouvé" });
    }
    
    const providerId = provider._id;
    console.log('✅ Provider trouvé:', providerId);

    // Dates pour les calculs
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Stats des réservations
    const [
      totalBookings,
      completedBookings,
      pendingBookings,
      acceptedBookings,
      cancelledBookings,
      paidBookings
    ] = await Promise.all([
      Booking.countDocuments({ provider: providerId }),
      Booking.countDocuments({ provider: providerId, status: { $in: ['completed', 'paid'] } }),
      Booking.countDocuments({ provider: providerId, status: 'pending' }),
      Booking.countDocuments({ provider: providerId, status: 'accepted' }),
      Booking.countDocuments({ provider: providerId, status: 'cancelled' }),
      Booking.countDocuments({ provider: providerId, paymentStatus: 'paid' })
    ]);

    console.log('📋 Bookings:', { totalBookings, completedBookings, pendingBookings, acceptedBookings });

    // Revenus totaux (réservations payées ou terminées)
    const allPaidBookings = await Booking.find({ 
      provider: providerId, 
      $or: [
        { status: { $in: ['completed', 'paid'] } },
        { paymentStatus: 'paid' }
      ]
    });
    
    let totalRevenue = 0;
    allPaidBookings.forEach(booking => {
      totalRevenue += booking.proposedPrice || 0;
    });
    console.log('💰 Total Revenue:', totalRevenue, 'from', allPaidBookings.length, 'bookings');

    // Revenus mensuels
    const monthlyBookings = await Booking.find({ 
      provider: providerId,
      date: { $gte: startOfMonth },
      $or: [
        { status: { $in: ['completed', 'paid'] } },
        { paymentStatus: 'paid' }
      ]
    });
    let monthlyRevenue = 0;
    monthlyBookings.forEach(b => monthlyRevenue += b.proposedPrice || 0);

    // Revenus hebdomadaires
    const weeklyBookings = await Booking.find({ 
      provider: providerId,
      date: { $gte: startOfWeek },
      $or: [
        { status: { $in: ['completed', 'paid'] } },
        { paymentStatus: 'paid' }
      ]
    });
    let weeklyRevenue = 0;
    weeklyBookings.forEach(b => weeklyRevenue += b.proposedPrice || 0);

    // Revenus du jour
    const todayBookings = await Booking.find({ 
      provider: providerId,
      date: { $gte: startOfToday },
      $or: [
        { status: { $in: ['completed', 'paid'] } },
        { paymentStatus: 'paid' }
      ]
    });
    let todayRevenue = 0;
    todayBookings.forEach(b => todayRevenue += b.proposedPrice || 0);

    // Durée totale travaillée (en minutes)
    const allCompletedBookings = await Booking.find({ 
      provider: providerId, 
      status: { $in: ['completed', 'paid'] }
    });
    let totalDuration = 0;
    allCompletedBookings.forEach(b => totalDuration += b.estimatedDuration || 0);
    
    // Convertir en heures et minutes
    const totalHours = Math.floor(totalDuration / 60);
    const totalMinutes = totalDuration % 60;

    // Clients uniques
    const uniqueClients = await Booking.distinct('client', { provider: providerId });
    
    // Clients fidèles (plus d'une réservation)
    const clientBookingCounts = {};
    const allBookings = await Booking.find({ provider: providerId });
    allBookings.forEach(b => {
      const clientId = b.client.toString();
      clientBookingCounts[clientId] = (clientBookingCounts[clientId] || 0) + 1;
    });
    const repeatCustomers = Object.values(clientBookingCounts).filter(count => count > 1).length;

    // Taux de conversion (réservations terminées / total)
    const conversionRate = totalBookings > 0 
      ? Math.round((completedBookings / totalBookings) * 100) 
      : 0;

    // Note moyenne et nombre d'avis
    const averageRating = provider.noteGenerale || 0;
    const totalReviews = provider.nombreAvis || 0;

    const stats = {
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      todayRevenue,
      totalBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      averageRating,
      totalReviews,
      conversionRate,
      repeatCustomers,
      totalHours,
      totalMinutes,
      totalDuration
    };

    console.log('📊 Stats finales:', stats);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('❌ Error in getProviderStats:', error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// ===== GET PROVIDER REVENUE CHART =====
export const getProviderRevenueChart = async (req, res) => {
  try {
    const { id } = req.params;

    // Trouver le provider
    const provider = await Provider.findOne({ user: id }) || await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Prestataire non trouvé" });
    }
    
    const providerId = provider._id;

    // Récupérer les revenus des 7 derniers mois
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 6);
    sevenMonthsAgo.setDate(1);
    sevenMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Booking.aggregate([
      {
        $match: { 
          provider: providerId,
          date: { $gte: sevenMonthsAgo },
          $or: [
            { status: { $in: ['completed', 'paid'] } },
            { paymentStatus: 'paid' }
          ]
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          revenue: { $sum: { $ifNull: ['$proposedPrice', 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Formater les données pour le graphique
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    // Créer un tableau avec les 7 derniers mois
    const chartData = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const found = monthlyRevenue.find(
        item => item._id.year === year && item._id.month === month
      );
      
      chartData.push({
        month: monthNames[month - 1],
        revenue: found ? found.revenue : 0
      });
    }

    res.status(200).json({ success: true, data: chartData });
  } catch (error) {
    console.error('Error in getProviderRevenueChart:', error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// ===== VERIFY DOCUMENTS =====
export const verifyDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentId, status, rejectionReason } = req.body;

    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({ message: "Prestataire non trouvé" });
    }

    const document = provider.verificationDocuments.id(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document non trouvé" });
    }

    document.status = status;
    document.isVerified = status === "verified";

    if (status === "rejected" && rejectionReason) {
      document.rejectionReason = rejectionReason;
    }

    await provider.save();

    // Vérifier si tous les documents sont vérifiés pour marquer le provider comme vérifié
    const allDocumentsVerified = provider.verificationDocuments.every(
      (doc) => doc.status === "verified"
    );

    if (allDocumentsVerified && provider.verificationDocuments.length > 0) {
      provider.isVerified = true;
      await provider.save();
    }

    res.status(200).json({
      message: "Document mis à jour avec succès",
      document,
      providerVerified: provider.isVerified,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ===== GET DOCUMENTS STATUS (pour le prestataire) =====
export const getMyDocumentsStatus = async (req, res) => {
  try {
    console.log("📄 getMyDocumentsStatus appelé");

    // ✅ Vérifier que req.user existe
    if (!req.user || !req.user._id) {
      console.log("❌ req.user est undefined");
      return res.status(401).json({ message: "Non authentifié" });
    }

    const userId = req.user._id;
    console.log("👤 UserId:", userId);

    const provider = await Provider.findOne({ user: userId }).populate(
      "user",
      "nom prenom email"
    );

    if (!provider) {
      console.log("❌ Provider non trouvé pour userId:", userId);
      return res.status(404).json({ message: "Profil prestataire non trouvé" });
    }

    console.log("✅ Provider trouvé:", provider._id);

    // Compter les documents par statut
    const stats = {
      total: provider.verificationDocuments?.length || 0,
      pending:
        provider.verificationDocuments?.filter((d) => d.status === "pending")
          .length || 0,
      verified:
        provider.verificationDocuments?.filter((d) => d.status === "verified")
          .length || 0,
      rejected:
        provider.verificationDocuments?.filter((d) => d.status === "rejected")
          .length || 0,
    };

    console.log("📊 Stats:", stats);

    res.status(200).json({
      provider: {
        _id: provider._id,
        isVerified: provider.isVerified,
        verificationDocuments: provider.verificationDocuments || [],
        stats,
      },
    });
  } catch (error) {
    console.error("❌ Erreur getMyDocumentsStatus:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ===== RE-SOUMETTRE DES DOCUMENTS REJETÉS =====
export const resubmitDocuments = async (req, res) => {
  try {
    console.log("📤 resubmitDocuments appelé");

    const { id } = req.params; // ID du provider

    // ✅ Vérifier que req.user existe
    if (!req.user || !req.user._id) {
      console.log("❌ req.user est undefined");
      return res.status(401).json({ message: "Non authentifié" });
    }

    const userId = req.user._id;
    console.log("👤 UserId:", userId);
    console.log("🆔 ProviderId:", id);

    const provider = await Provider.findById(id).populate("user");

    if (!provider) {
      console.log("❌ Provider non trouvé");
      return res.status(404).json({ message: "Prestataire non trouvé" });
    }

    // ✅ Vérifier que c'est bien le prestataire qui fait la demande
    if (provider.user._id.toString() !== userId.toString()) {
      console.log(
        "❌ Non autorisé - userId:",
        userId,
        "provider.user._id:",
        provider.user._id
      );
      return res.status(403).json({ message: "Non autorisé" });
    }

    // Traiter les nouveaux documents
    const newVerificationDocuments = [];

    if (req.files?.certifications) {
      console.log(
        `📄 ${req.files.certifications.length} nouveau(x) certificat(s)`
      );
      req.files.certifications.forEach((file) => {
        newVerificationDocuments.push({
          documentType: "certificate",
          path: file.path,
          status: "pending",
          isVerified: false,
          uploadedAt: new Date(),
        });
      });
    }

    if (req.files?.documents) {
      console.log(`📄 ${req.files.documents.length} nouveau(x) document(s)`);
      req.files.documents.forEach((file) => {
        newVerificationDocuments.push({
          documentType: "other",
          path: file.path,
          status: "pending",
          isVerified: false,
          uploadedAt: new Date(),
        });
      });
    }

    if (newVerificationDocuments.length === 0) {
      return res.status(400).json({ message: "Aucun document fourni" });
    }

    // Ajouter les nouveaux documents
    provider.verificationDocuments.push(...newVerificationDocuments);

    // Remettre le statut à "en attente" si le compte était refusé
    provider.isVerified = false;

    await provider.save();

    console.log(`✅ ${newVerificationDocuments.length} document(s) ajouté(s)`);

    res.status(200).json({
      message: "Documents re-soumis avec succès",
      provider,
    });
  } catch (error) {
    console.error("❌ Erreur resubmitDocuments:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ===== UPLOAD SINGLE DOCUMENT =====
export const uploadSingleDocument = async (req, res) => {
  try {
    console.log("📤 uploadSingleDocument appelé");

    const { id } = req.params; // ID du provider
    const { documentType } = req.body;

    // Vérifier que req.user existe
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const userId = req.user._id;

    // Vérifier que le type de document est valide
    const validTypes = ['id', 'certificate', 'license', 'other'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ 
        message: "Type de document invalide. Types valides: id, certificate, license, other" 
      });
    }

    const provider = await Provider.findById(id).populate("user");

    if (!provider) {
      return res.status(404).json({ message: "Prestataire non trouvé" });
    }

    // Vérifier que c'est bien le prestataire qui fait la demande
    if (provider.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    // Vérifier qu'un fichier a été envoyé
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    console.log(`📄 Document reçu: ${req.file.originalname} (${documentType})`);

    // Vérifier si un document de ce type existe déjà et est rejeté
    const existingDocIndex = provider.verificationDocuments.findIndex(
      d => d.documentType === documentType
    );

    if (existingDocIndex !== -1) {
      const existingDoc = provider.verificationDocuments[existingDocIndex];
      
      // Si le document existant n'est pas rejeté, on ne peut pas le remplacer
      if (existingDoc.status !== 'rejected') {
        return res.status(400).json({ 
          message: `Un document de type "${documentType}" existe déjà et n'a pas été rejeté` 
        });
      }

      // Remplacer le document rejeté
      provider.verificationDocuments[existingDocIndex] = {
        documentType,
        path: req.file.path,
        status: 'pending',
        isVerified: false,
        uploadedAt: new Date()
      };

      console.log(`📝 Document "${documentType}" remplacé`);
    } else {
      // Ajouter un nouveau document
      provider.verificationDocuments.push({
        documentType,
        path: req.file.path,
        status: 'pending',
        isVerified: false,
        uploadedAt: new Date()
      });

      console.log(`➕ Nouveau document "${documentType}" ajouté`);
    }

    // Remettre le statut à "en attente" si le compte était refusé
    provider.isVerified = false;

    await provider.save();

    res.status(200).json({
      message: "Document envoyé avec succès",
      document: {
        documentType,
        path: req.file.path,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error("❌ Erreur uploadSingleDocument:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
