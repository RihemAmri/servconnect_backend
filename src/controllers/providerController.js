import Provider from '../models/providerModel.js';
import User from '../models/user.model.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';

// ===== REGISTER PROVIDER =====
export const registerProvider = async (req, res) => {
  try {
    const { userId, metier, description, experience, certifications } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur n'est pas déjà provider
    const existingProvider = await Provider.findOne({ user: userId });
    if (existingProvider) {
      return res.status(400).json({ message: 'Cet utilisateur est déjà un prestataire' });
    }

    // Traiter les documents de vérification si des fichiers sont uploadés
    const verificationDocuments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        verificationDocuments.push({
          documentType: file.fieldname, // Le type sera dans le fieldname
          path: file.path,
          status: 'pending'
        });
      });
    }

    // Créer le provider
    const newProvider = new Provider({
      user: userId,
      metier,
      description,
      experience: parseInt(experience) || 0,
      certifications: certifications ? certifications.split(',') : [],
      verificationDocuments
    });

    await newProvider.save();

    res.status(201).json({
      message: 'Prestataire créé avec succès',
      provider: newProvider
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
      sortBy = 'noteGenerale', 
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Construction du filtre
    const filter = {};
    
    if (category && category !== 'Tous') {
      filter.metier = new RegExp(category, 'i');
    }
    
    if (minRating) {
      filter.noteGenerale = { $gte: parseFloat(minRating) };
    }

    // Options de pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Récupération des providers
    const providers = await Provider.find(filter)
      .populate('user', 'nom prenom email telephone adresse photo')
      .populate('reviews')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalProviders = await Provider.countDocuments(filter);
    console.log("Fetched providers:", providers);
    res.status(200).json({
      providers,
      totalPages: Math.ceil(totalProviders / parseInt(limit)),
      currentPage: parseInt(page),
      totalProviders
    });
  } catch (error) {
    
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ===== GET PROVIDER BY ID =====
export const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await Provider.findById(id)
      .populate('user', 'nom prenom email telephone adresse photo')
      .populate({
        path: 'reviews',
        populate: {
          path: 'client',
          select: 'nom prenom'
        }
      });

    if (!provider) {
      return res.status(404).json({ message: 'Prestataire non trouvé' });
    }

    res.status(200).json({ provider });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ===== UPDATE PROVIDER =====
export const updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Si de nouveaux documents sont uploadés
    if (req.files && req.files.length > 0) {
      const newVerificationDocuments = req.files.map(file => ({
        documentType: file.fieldname,
        path: file.path,
        status: 'pending'
      }));

      const provider = await Provider.findById(id);
      if (provider) {
        provider.verificationDocuments.push(...newVerificationDocuments);
        updates.verificationDocuments = provider.verificationDocuments;
      }
    }

    const updatedProvider = await Provider.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'nom prenom email telephone adresse photo');

    if (!updatedProvider) {
      return res.status(404).json({ message: 'Prestataire non trouvé' });
    }

    res.status(200).json({
      message: 'Prestataire mis à jour avec succès',
      provider: updatedProvider
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
      return res.status(404).json({ message: 'Prestataire non trouvé' });
    }

    res.status(200).json({
      message: 'Disponibilités mises à jour avec succès',
      disponibilite: provider.disponibilite
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
      .populate('client', 'nom prenom email telephone')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBookings = await Booking.countDocuments(filter);

    res.status(200).json({
      bookings,
      totalPages: Math.ceil(totalBookings / parseInt(limit)),
      currentPage: parseInt(page),
      totalBookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ===== GET PROVIDER STATS =====
export const getProviderStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Stats basiques du provider
    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({ message: 'Prestataire non trouvé' });
    }

    // Stats des réservations
    const totalBookings = await Booking.countDocuments({ provider: id });
    const completedBookings = await Booking.countDocuments({ 
      provider: id, 
      status: 'completed' 
    });
    const pendingBookings = await Booking.countDocuments({ 
      provider: id, 
      status: 'pending' 
    });
    const acceptedBookings = await Booking.countDocuments({ 
      provider: id, 
      status: 'accepted' 
    });

    // Revenus totaux
    const revenueResult = await Booking.aggregate([
      { $match: { provider: mongoose.Types.ObjectId(id), status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$price' } } }
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Réservations par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBookings = await Booking.aggregate([
      {
        $match: {
          provider: mongoose.Types.ObjectId(id),
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const stats = {
      provider: {
        noteGenerale: provider.noteGenerale,
        nombreAvis: provider.nombreAvis,
        isVerified: provider.isVerified
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        pending: pendingBookings,
        accepted: acceptedBookings
      },
      revenue: {
        total: totalRevenue,
        average: completedBookings > 0 ? (totalRevenue / completedBookings) : 0
      },
      monthlyBookings
    };

    res.status(200).json({ stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ===== VERIFY DOCUMENTS =====
export const verifyDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentId, status, rejectionReason } = req.body;

    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({ message: 'Prestataire non trouvé' });
    }

    const document = provider.verificationDocuments.id(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    document.status = status;
    document.isVerified = status === 'verified';
    
    if (status === 'rejected' && rejectionReason) {
      document.rejectionReason = rejectionReason;
    }

    await provider.save();

    // Vérifier si tous les documents sont vérifiés pour marquer le provider comme vérifié
    const allDocumentsVerified = provider.verificationDocuments.every(
      doc => doc.status === 'verified'
    );
    
    if (allDocumentsVerified && provider.verificationDocuments.length > 0) {
      provider.isVerified = true;
      await provider.save();
    }

    res.status(200).json({
      message: 'Document mis à jour avec succès',
      document,
      providerVerified: provider.isVerified
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};