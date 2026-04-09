import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminName: { type: String },
  action: { type: String, required: true },
  target: { type: String }, // e.g. "Application", "User", "Route"
  targetId: { type: String },
  details: { type: String },
  ip: { type: String },
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);
