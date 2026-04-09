import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['success', 'warning', 'info', 'danger'], default: 'info' },
  read: { type: Boolean, default: false },
  link: { type: String }, // optional deep link
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
