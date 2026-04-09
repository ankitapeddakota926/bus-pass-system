import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'success', 'danger'], default: 'info' },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('Announcement', announcementSchema);
