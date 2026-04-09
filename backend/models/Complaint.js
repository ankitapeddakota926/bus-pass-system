import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['Complaint', 'Feedback'], required: true },
  category: { type: String, enum: ['Driver Behavior', 'Bus Condition', 'Route Issue', 'Pass Issue', 'Payment Issue', 'Other'], default: 'Other' },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
  adminReply: { type: String },
  repliedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('Complaint', complaintSchema);
