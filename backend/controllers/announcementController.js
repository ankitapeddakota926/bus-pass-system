import Announcement from '../models/Announcement.js';
import { logAction } from '../utils/auditLog.js';

export const getActiveAnnouncements = async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      active: true,
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }]
    }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type, expiresAt } = req.body;
    const ann = await Announcement.create({ admin: req.user._id, title, message, type, expiresAt });
    await logAction(req, 'CREATE_ANNOUNCEMENT', 'Announcement', ann._id, title);
    res.status(201).json(ann);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    await logAction(req, 'DELETE_ANNOUNCEMENT', 'Announcement', req.params.id, '');
    res.json({ message: 'Announcement deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({}).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
