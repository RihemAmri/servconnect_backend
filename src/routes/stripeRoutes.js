import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook,
  getPaymentDetails,
  createRefund
} from '../controllers/stripeController.js';

const router = express.Router();

// 💳 Créer un Payment Intent
router.post('/create-payment-intent', createPaymentIntent);

// ✅ Confirmer un paiement
router.post('/confirm-payment', confirmPayment);

// 💰 Récupérer les détails d'un paiement
router.get('/payment/:paymentIntentId', getPaymentDetails);

// 🔙 Créer un remboursement
router.post('/refund', createRefund);

// 🔄 Webhook Stripe (doit utiliser raw body, géré dans app.js)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;
