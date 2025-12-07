import Stripe from 'stripe';
import Booking from '../models/bookingModel.js';

// 🔧 MODE DE PAIEMENT
// false = Utiliser la vraie API Stripe
// true = Simulation sans API (pour tests sans carte)
const FORCE_TEST_MODE = false;

// Initialiser Stripe avec la clé secrète
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const isTestMode = FORCE_TEST_MODE || !stripeSecretKey || stripeSecretKey.includes('VOTRE') || stripeSecretKey.includes('_ICI');
const stripe = isTestMode ? null : new Stripe(stripeSecretKey);

console.log(`💳 Stripe: ${isTestMode ? '🧪 MODE SIMULATION (pas de vraie API)' : '✅ MODE PRODUCTION avec Stripe API'}`);
if (!isTestMode) {
  console.log(`   📌 Clé Stripe: ${stripeSecretKey?.substring(0, 12)}...`);
}

/**
 * 💳 Créer un Payment Intent pour une réservation
 * POST /api/stripe/create-payment-intent
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    // Validation
    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'bookingId et amount sont requis'
      });
    }

    // Vérifier que la réservation existe et est acceptée
    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'nom prenom email'
        }
      })
      .populate('client', 'nom prenom email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    if (booking.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation ne peut pas être payée (statut: ' + booking.status + ')'
      });
    }

    // 🧪 MODE TEST : Simuler le paiement sans Stripe
    if (isTestMode) {
      const fakePaymentIntentId = 'pi_test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const fakeClientSecret = fakePaymentIntentId + '_secret_test';
      
      console.log('🧪 Mode test - Payment Intent simulé:', fakePaymentIntentId);
      
      return res.status(200).json({
        success: true,
        clientSecret: fakeClientSecret,
        paymentIntentId: fakePaymentIntentId,
        amount: amount,
        currency: 'EUR',
        testMode: true,
        message: 'Mode test - Paiement simulé'
      });
    }

    // 💳 MODE PRODUCTION : Utiliser Stripe
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      metadata: {
        bookingId: bookingId,
        clientId: booking.client._id.toString(),
        providerId: booking.provider._id.toString(),
        service: booking.service
      },
      description: `Paiement pour ${booking.service} - ServConnect`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: 'EUR'
    });

  } catch (error) {
    console.error('Erreur createPaymentIntent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du paiement',
      error: error.message
    });
  }
};

/**
 * ✅ Confirmer un paiement réussi
 * POST /api/stripe/confirm-payment
 */
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'paymentIntentId et bookingId sont requis'
      });
    }

    // 🧪 MODE TEST : Accepter directement les paiements test
    if (isTestMode || paymentIntentId.startsWith('pi_test_')) {
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Réservation non trouvée'
        });
      }

      booking.status = 'paid';
      booking.paymentStatus = 'paid';
      booking.paymentIntentId = paymentIntentId;
      booking.paidAt = new Date();

      await booking.save();

      const updatedBooking = await Booking.findById(bookingId)
        .populate({
          path: 'provider',
          populate: {
            path: 'user',
            select: 'nom prenom email telephone photo'
          }
        })
        .populate('client', 'nom prenom email telephone photo');

      return res.status(200).json({
        success: true,
        message: 'Paiement confirmé avec succès (mode test)',
        data: updatedBooking,
        testMode: true
      });
    }

    // 💳 MODE PRODUCTION : Vérifier avec Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Le paiement n\'a pas été confirmé',
        status: paymentIntent.status
      });
    }

    // Mettre à jour la réservation
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    booking.status = 'paid';
    booking.paymentStatus = 'paid';
    booking.paymentIntentId = paymentIntentId;
    booking.paidAt = new Date();

    await booking.save();

    // Récupérer la réservation mise à jour avec les populations
    const updatedBooking = await Booking.findById(bookingId)
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
      message: 'Paiement confirmé avec succès',
      data: updatedBooking
    });

  } catch (error) {
    console.error('Erreur confirmPayment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation du paiement',
      error: error.message
    });
  }
};

/**
 * 🔄 Webhook Stripe pour les événements de paiement
 * POST /api/stripe/webhook
 */
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Erreur webhook signature:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les différents événements
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ PaymentIntent succeeded:', paymentIntent.id);
      
      // Mettre à jour la réservation automatiquement
      if (paymentIntent.metadata?.bookingId) {
        try {
          await Booking.findByIdAndUpdate(paymentIntent.metadata.bookingId, {
            status: 'paid',
            paymentStatus: 'paid',
            paymentIntentId: paymentIntent.id,
            paidAt: new Date()
          });
          console.log('📝 Booking updated via webhook:', paymentIntent.metadata.bookingId);
        } catch (error) {
          console.error('Erreur mise à jour booking via webhook:', error);
        }
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('❌ PaymentIntent failed:', failedPayment.id);
      break;

    case 'charge.refunded':
      const refund = event.data.object;
      console.log('🔄 Charge refunded:', refund.id);
      
      // Mettre à jour le statut de paiement
      if (refund.metadata?.bookingId) {
        try {
          await Booking.findByIdAndUpdate(refund.metadata.bookingId, {
            paymentStatus: 'refunded'
          });
        } catch (error) {
          console.error('Erreur mise à jour remboursement:', error);
        }
      }
      break;

    default:
      console.log(`Événement non géré: ${event.type}`);
  }

  res.json({ received: true });
};

/**
 * 💰 Récupérer les détails d'un Payment Intent
 * GET /api/stripe/payment/:paymentIntentId
 */
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).json({
      success: true,
      data: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: new Date(paymentIntent.created * 1000),
        metadata: paymentIntent.metadata
      }
    });

  } catch (error) {
    console.error('Erreur getPaymentDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails du paiement',
      error: error.message
    });
  }
};

/**
 * 🔙 Créer un remboursement
 * POST /api/stripe/refund
 */
export const createRefund = async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'paymentIntentId est requis'
      });
    }

    const refundParams = {
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer'
    };

    // Si un montant est spécifié, faire un remboursement partiel
    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundParams);

    res.status(200).json({
      success: true,
      message: 'Remboursement effectué avec succès',
      data: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      }
    });

  } catch (error) {
    console.error('Erreur createRefund:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du remboursement',
      error: error.message
    });
  }
};
