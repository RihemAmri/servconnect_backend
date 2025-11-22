import express from 'express';
import { reverseGeocode } from '../controllers/mapController.js';

const router = express.Router();

// GET /api/map/reverse?lat=...&lon=...
router.get('/reverse', reverseGeocode);

export default router;
