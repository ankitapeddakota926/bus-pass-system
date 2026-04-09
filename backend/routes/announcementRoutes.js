import express from 'express';
import { getActiveAnnouncements, createAnnouncement, deleteAnnouncement, getAllAnnouncements } from '../controllers/announcementController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', protect, getActiveAnnouncements);
router.get('/all', protect, admin, getAllAnnouncements);
router.post('/', protect, admin, createAnnouncement);
router.delete('/:id', protect, admin, deleteAnnouncement);
export default router;
