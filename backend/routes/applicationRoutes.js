import express from 'express';
import { 
  createApplication, getMyApplications, getApplications, 
  updateApplicationStatus, renewApplication, downloadPass,
  exportApplications, extendValidity, bulkUpdateStatus, blacklistPass, verifyPass
} from '../controllers/applicationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/').get(protect, admin, getApplications);
router.get('/export', protect, admin, exportApplications);

router.post('/apply-pass', protect,
  upload.fields([
    { name: 'applicationForm', maxCount: 1 }, { name: 'bonaFideCertificate', maxCount: 1 },
    { name: 'aadhaarCard', maxCount: 1 }, { name: 'feeReceipt', maxCount: 1 },
    { name: 'photograph', maxCount: 1 }, { name: 'casteCertificate', maxCount: 1 },
    { name: 'previousIdCard', maxCount: 1 }
  ]), createApplication
);

router.post('/renew/:id', protect, renewApplication);
router.get('/my', protect, getMyApplications);
router.get('/verify/:passId', verifyPass);
router.get('/:id/download-pass', protect, downloadPass);
router.put('/:id/status', protect, admin, updateApplicationStatus);
router.put('/:id/extend', protect, admin, extendValidity);
router.put('/:id/blacklist', protect, admin, blacklistPass);
router.put('/bulk-status', protect, admin, bulkUpdateStatus);

export default router;
