import express from 'express';
import {
  registerProvider,
  getProviders,
  getProviderById,
  updateProvider,
  updateAvailability,
  getProviderBookings,
  getProviderStats,
  verifyDocuments
} from '../controllers/providerController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// ===== ROUTES PROVIDERS =====
router.get('/', getProviders);                    // GET /api/providers
router.get('/:id', getProviderById);              // GET /api/providers/:id
router.get('/:id/stats', getProviderStats);       // GET /api/providers/:id/stats
router.get('/:id/bookings', getProviderBookings); // GET /api/providers/:id/bookings
router.post('/register', upload.array('documents', 5), registerProvider); // POST /api/providers/register
router.put('/:id', upload.array('documents', 5), updateProvider); // PUT /api/providers/:id
router.put('/:id/availability', updateAvailability); // PUT /api/providers/:id/availability
router.put('/:id/verify', verifyDocuments);       // PUT /api/providers/:id/verify

export default router;