import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(200);
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
