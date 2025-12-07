import Booking from '../models/bookingModel.js';
import Provider from '../models/providerModel.js';
import User from '../models/user.model.js';
import Review from '../models/Review.js';

// 📝 POST /bookings - Créer une nouvelle réservation (côté client)
export const createBooking = async (req, res) => {
  
  try {
    const {
      providerId,
      clientId,
      date,
      time,
      serviceType,
      description,
      urgency = 'normal',
      location
    } = req.body;

    // ✅ Validation des champs requis
    if (!providerId || !clientId || !date || !time || !serviceType || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs requis doivent être remplis'
      });
    }

    // Parse location if it's a string
    let parsedLocation = location;
    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Format de localisation invalide'
        });
      }
    }

    // 🔍 Vérifier que le provider existe
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider non trouvé'
      });
    }

    // 🔍 Vérifier que le client existe
    const client = await User.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // 📅 Vérifier que la date n'est pas dans le passé
    const bookingDate = new Date(date);
    if (bookingDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'La date de réservation ne peut pas être dans le passé'
      });
    }

    // 🔄 Vérifier qu'il n'y a pas de conflit de créneau (si nécessaire)
    const existingBooking = await Booking.findOne({
      provider: providerId,
      date: bookingDate,
      time: time,
      status: { $in: ['pending', 'accepted', 'confirmed'] }
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Ce créneau est déjà réservé'
      });
    }

    // Handle file uploads (photos)
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      photoUrls = req.files.map(file => file.path); // Cloudinary URLs
    }

    // 📋 Créer la réservation
    const newBooking = new Booking({
      provider: providerId,
      client: clientId,
      date: bookingDate,
      time: time,
      service: serviceType,
      cause: description,
      urgency: urgency,
      location: {
        address: parsedLocation.address || `${parsedLocation.lat}, ${parsedLocation.lng}`,
        lat: parsedLocation.lat,
        lng: parsedLocation.lng
      },
      attachments: photoUrls,
      status: 'pending'
    });

    await newBooking.save();

    // 📤 Populer les données pour la réponse
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('provider', 'metier user')
      .populate('client', 'nom prenom email telephone photo');
    console.log("test mrigla booking:", populatedBooking);
    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès! Le prestataire examinera votre demande.',
      data: populatedBooking
    });

  } catch (error) {
    console.error('Erreur createBooking:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de la réservation',
      error: error.message
    });
  }
};

// 📋 GET /bookings/:id - Récupérer une réservation spécifique
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'nom prenom email telephone photo'
        }
      })
      .populate('client', 'nom prenom email telephone photo');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Erreur getBookingById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de la réservation',
      error: error.message
    });
  }
};

// ✅ PUT /bookings/:id/accept - Provider accepte la réservation
export const acceptBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      price, 
      estimatedDuration, 
      notes = '',
      providerId 
    } = req.body;

    // ✅ Validation des champs requis
    if (!price || !estimatedDuration) {
      return res.status(400).json({
        success: false,
        message: 'Prix et durée estimée sont requis'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // 🔒 Vérifier que c'est bien le provider concerné
    if (booking.provider.toString() !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier cette réservation'
      });
    }

    // 🔄 Vérifier le statut
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation ne peut plus être acceptée'
      });
    }

    // 💰 Mettre à jour la réservation
    booking.status = 'accepted';
    booking.proposedPrice = price;
    booking.estimatedDuration = estimatedDuration;
    booking.providerNotes = notes;
    booking.acceptedAt = new Date();

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'nom prenom email telephone photo'
        }
      })
      .populate('client', 'nom prenom email telephone photo');

    res.status(200).json({
      success: true,
      message: 'Réservation acceptée avec succès',
      data: updatedBooking
    });

  } catch (error) {
    console.error('Erreur acceptBooking:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'acceptation de la réservation',
      error: error.message
    });
  }
};

// ❌ PUT /bookings/:id/refuse - Provider refuse la réservation
export const refuseBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      refuseReason = '',
      providerId 
    } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // 🔒 Vérifier que c'est bien le provider concerné
    if (booking.provider.toString() !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier cette réservation'
      });
    }

    // 🔄 Vérifier le statut
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation ne peut plus être refusée'
      });
    }

    // ❌ Refuser la réservation
    booking.status = 'refused';
    booking.refusalReason = refuseReason;

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'nom prenom email telephone photo'
        }
      })
      .populate('client', 'nom prenom email telephone photo');

    res.status(200).json({
      success: true,
      message: 'Réservation refusée',
      data: updatedBooking
    });

  } catch (error) {
    console.error('Erreur refuseBooking:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du refus de la réservation',
      error: error.message
    });
  }
};

// 💳 PUT /bookings/:id/pay - Client effectue le paiement
export const payBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      paymentMethod,
      paymentDetails = {},
      clientId 
    } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // 🔒 Vérifier que c'est bien le client concerné
    if (booking.client.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à payer cette réservation'
      });
    }

    // 🔄 Vérifier le statut
    if (booking.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation ne peut pas être payée'
      });
    }

    // 💳 Simuler le paiement (ici tu peux intégrer une vraie gateway)
    const paymentSuccess = true; // Simulation

    if (paymentSuccess) {
      booking.status = 'paid';
      booking.paymentMethod = paymentMethod;
      booking.paymentDetails = paymentDetails;
      booking.paidAt = new Date();

      await booking.save();

      const updatedBooking = await Booking.findById(id)
        .populate({
          path: 'provider',
          populate: {
            path: 'user',
            select: 'nom prenom email telephone photo'
          }
        })
        .populate('client', 'nom prenom email telephone photo');

      res.status(200).json({
        success: true,
        message: 'Paiement effectué avec succès',
        data: updatedBooking
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Échec du paiement'
      });
    }

  } catch (error) {
    console.error('Erreur payBooking:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du paiement',
      error: error.message
    });
  }
};

// ✅ PUT /bookings/:id/complete - Provider marque le service comme terminé
export const completeBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      completionNotes = '',
      actualDuration,
      providerId 
    } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // 🔒 Vérifier que c'est bien le provider concerné
    if (booking.provider.toString() !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier cette réservation'
      });
    }

    // 🔄 Vérifier le statut - Peut marquer terminé si accepté ou payé
    if (booking.status !== 'paid' && booking.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation doit être acceptée ou payée pour être marquée comme terminée'
      });
    }

    // ✅ Marquer comme terminé
    booking.status = 'completed';
    booking.completionNotes = completionNotes;
    booking.actualDuration = actualDuration;
    booking.completedAt = new Date();

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'nom prenom email telephone photo'
        }
      })
      .populate('client', 'nom prenom email telephone photo');

    res.status(200).json({
      success: true,
      message: 'Service marqué comme terminé',
      data: updatedBooking
    });

  } catch (error) {
    console.error('Erreur completeBooking:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la finalisation du service',
      error: error.message
    });
  }
};

// 📋 GET /bookings/client/:clientId - Récupérer toutes les réservations d'un client
export const getClientBookings = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { status } = req.query;

    let filter = { client: clientId };
    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'nom prenom email telephone photo'
        }
      })
      .sort({ createdAt: -1 });

    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      accepted: bookings.filter(b => b.status === 'accepted').length,
      paid: bookings.filter(b => b.status === 'paid').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      refused: bookings.filter(b => b.status === 'refused').length
    };

    res.status(200).json({
      success: true,
      data: bookings,
      stats
    });

  } catch (error) {
    console.error('Erreur getClientBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des réservations client',
      error: error.message
    });
  }
};

// ⭐ POST /bookings/:id/review - Client laisse un avis après service terminé
export const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, clientId } = req.body;

    // ✅ Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Note requise (1-5 étoiles)'
      });
    }

    const booking = await Booking.findById(id)
      .populate('provider');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // 🔒 Vérifications
    if (booking.client.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Le service doit être terminé pour laisser un avis'
      });
    }

    // 🔍 Vérifier qu'il n'y a pas déjà un avis
    const existingReview = await Review.findOne({
      provider: booking.provider._id,
      client: clientId,
      booking: id
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'Avis déjà donné pour cette réservation'
      });
    }

    // ⭐ Créer l'avis
    const review = new Review({
      provider: booking.provider._id,
      client: clientId,
      booking: id,
      rating,
      comment
    });

    await review.save();

    // 📊 Mettre à jour les stats du provider
    const provider = booking.provider;
    provider.reviews.push(review._id);
    provider.nombreAvis = provider.reviews.length;

    // Recalculer la note moyenne
    const allReviews = await Review.find({ provider: provider._id });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    provider.noteGenerale = Math.round(avgRating * 10) / 10;

    await provider.save();

    const populatedReview = await Review.findById(review._id)
      .populate('client', 'nom prenom photo');

    res.status(201).json({
      success: true,
      message: 'Avis ajouté avec succès',
      data: populatedReview
    });

  } catch (error) {
    console.error('Erreur addReview:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'ajout de l\'avis',
      error: error.message
    });
  }
};

// 📋 GET /bookings/provider/:providerId - Récupérer toutes les réservations d'un provider
export const getProviderBookings = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { status } = req.query;

    let filter = { provider: providerId };
    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate('client', 'nom prenom email telephone photo')
      .sort({ createdAt: -1 });

    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      accepted: bookings.filter(b => b.status === 'accepted').length,
      paid: bookings.filter(b => b.status === 'paid').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      refused: bookings.filter(b => b.status === 'refused').length
    };

    res.status(200).json({
      success: true,
      data: bookings,
      stats
    });

  } catch (error) {
    console.error('Erreur getProviderBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des réservations provider',
      error: error.message
    });
  }
};

// 🔔 GET /bookings/provider/:providerId/pending - Demandes en attente (GestionBook)
export const getPendingBookings = async (req, res) => {
  try {
    const { providerId } = req.params;

    const bookings = await Booking.find({
      provider: providerId,
      status: 'pending'
    })
      .populate('client', 'nom prenom email telephone photo')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    console.error('Erreur getPendingBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des demandes en attente',
      error: error.message
    });
  }
};

// 📅 GET /bookings/provider/:providerId/upcoming - Services à venir (Upcoming Services)
export const getUpcomingBookings = async (req, res) => {
  try {
    const { providerId } = req.params;

    const bookings = await Booking.find({
      provider: providerId,
      status: { $in: ['accepted', 'paid'] },
      date: { $gte: new Date() } // Date future uniquement
    })
      .populate('client', 'nom prenom email telephone photo')
      .sort({ date: 1, time: 1 }); // Trier par date croissante

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    console.error('Erreur getUpcomingBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des services à venir',
      error: error.message
    });
  }
};

// ✅ GET /bookings/provider/:providerId/completed - Services terminés (Past Services)
export const getCompletedBookings = async (req, res) => {
  try {
    const { providerId } = req.params;

    const bookings = await Booking.find({
      provider: providerId,
      status: 'completed'
    })
      .populate('client', 'nom prenom email telephone photo')
      .sort({ completedAt: -1 }); // Plus récent en premier

    // Calculer les statistiques
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.proposedPrice || 0), 0);
    const totalDuration = bookings.reduce((sum, b) => sum + (b.estimatedDuration || 0), 0);

    res.status(200).json({
      success: true,
      count: bookings.length,
      stats: {
        totalRevenue,
        totalDuration,
        averagePrice: bookings.length > 0 ? totalRevenue / bookings.length : 0
      },
      data: bookings
    });

  } catch (error) {
    console.error('Erreur getCompletedBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des services terminés',
      error: error.message
    });
  }
};

// 📊 GET /bookings/provider/:providerId/all - Toutes les réservations avec stats (MyServices)
export const getAllProviderBookings = async (req, res) => {
  try {
    const { providerId } = req.params;

    // Récupérer toutes les réservations du provider
    const allBookings = await Booking.find({ provider: providerId })
      .populate('client', 'nom prenom email telephone photo')
      .sort({ date: 1, time: 1 }); // Trier par date croissante

    // Grouper par statut
    const pending = allBookings.filter(b => b.status === 'pending');
    const accepted = allBookings.filter(b => b.status === 'accepted');
    const paid = allBookings.filter(b => b.status === 'paid');
    const completed = allBookings.filter(b => b.status === 'completed');
    const refused = allBookings.filter(b => b.status === 'refused');
    const cancelled = allBookings.filter(b => b.status === 'cancelled');

    // Calculer les statistiques
    const totalRevenue = completed.reduce((sum, b) => sum + (b.proposedPrice || 0), 0);
    const pendingRevenue = [...accepted, ...paid].reduce((sum, b) => sum + (b.proposedPrice || 0), 0);
    const totalDuration = completed.reduce((sum, b) => sum + (b.estimatedDuration || 0), 0);

    // Statistiques du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const thisMonthBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= startOfMonth && bookingDate <= endOfMonth;
    });

    const thisMonthCompleted = thisMonthBookings.filter(b => b.status === 'completed');
    const thisMonthRevenue = thisMonthCompleted.reduce((sum, b) => sum + (b.proposedPrice || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        total: allBookings.length,
        pending: pending.length,
        accepted: accepted.length,
        paid: paid.length,
        completed: completed.length,
        refused: refused.length,
        cancelled: cancelled.length,
        totalRevenue,
        pendingRevenue,
        totalDuration,
        thisMonth: {
          total: thisMonthBookings.length,
          completed: thisMonthCompleted.length,
          revenue: thisMonthRevenue
        }
      },
      data: {
        all: allBookings,
        pending,
        accepted,
        paid,
        completed,
        refused,
        cancelled
      }
    });

  } catch (error) {
    console.error('Erreur getAllProviderBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des réservations',
      error: error.message
    });
  }
};

// ❌ PUT /bookings/:id/cancel - Client annule la réservation
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId, reason = '' } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // 🔒 Vérifier que c'est bien le client concerné
    if (booking.client.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à annuler cette réservation'
      });
    }

    // 🔄 Vérifier le statut - Peut annuler si pending ou accepted (avant paiement)
    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation ne peut plus être annulée'
      });
    }

    // ❌ Annuler la réservation
    booking.status = 'cancelled';
    booking.refusalReason = reason || 'Annulée par le client';

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'nom prenom email telephone'
        }
      })
      .populate('client', 'nom prenom email telephone');

    res.status(200).json({
      success: true,
      message: 'Réservation annulée avec succès',
      data: updatedBooking
    });

  } catch (error) {
    console.error('Erreur cancelBooking:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'annulation de la réservation',
      error: error.message
    });
  }
};