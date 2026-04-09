import AuditLog from '../models/AuditLog.js';

export const logAction = async (req, action, target, targetId, details) => {
  try {
    await AuditLog.create({
      admin: req.user._id,
      adminName: req.user.name,
      action,
      target,
      targetId: targetId?.toString(),
      details,
      ip: req.ip,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};
