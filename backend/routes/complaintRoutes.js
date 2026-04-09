import express from 'express';
import { createComplaint, getMyComplaints, getAllComplaints, replyComplaint } from '../controllers/complaintController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/', protect, admin, getAllComplaints);
router.put('/:id/reply', protect, admin, replyComplaint);

export default router;
