import express from 'express';

const router = express.Router();

router.post('/apply', (req, res) => {
  res.status(200).json({ message: 'Apply pass logic' });
});

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Get all passes logic' });
});

export default router;
