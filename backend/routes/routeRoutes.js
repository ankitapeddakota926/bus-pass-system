import express from 'express';
import { createRoute, getRoutes, deleteRoute } from '../controllers/routeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getRoutes).post(protect, admin, createRoute);
router.delete('/:id', protect, admin, deleteRoute);

export default router;
