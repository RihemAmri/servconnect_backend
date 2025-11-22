import Booking from '../models/Booking.js';
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
          select: 'nom prenom email phone profileImage'
        }
      })
      .populate('client', 'nom prenom email phone profileImage');

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
    booking.price = price;
    booking.estimatedDuration = estimatedDuration;
    booking.notes = notes;

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'nom prenom email phone'
        }
      })
      .populate('client', 'nom prenom email phone');

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
    booking.refuseReason = refuseReason;

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'nom prenom email phone'
        }
      })
      .populate('client', 'nom prenom email phone');

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
            select: 'nom prenom email phone'
          }
        })
        .populate('client', 'nom prenom email phone');

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

    // 🔄 Vérifier le statut
    if (booking.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation ne peut pas être marquée comme terminée'
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
          select: 'nom prenom email phone'
        }
      })
      .populate('client', 'nom prenom email phone');

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
          select: 'nom prenom email phone profileImage'
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
      .populate('client', 'nom prenom profileImage');

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