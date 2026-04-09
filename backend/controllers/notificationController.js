import Notification from '../models/Notification.js';

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
    res.json(notifications);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Helper to create notification (used internally)
export const createNotification = async (userId, title, message, type = 'info', link = '') => {
  try {
    await Notification.create({ user: userId, title, message, type, link });
  } catch (err) { console.error('Notification creation failed:', err.message); }
};
