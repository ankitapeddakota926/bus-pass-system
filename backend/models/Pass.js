import mongoose from 'mongoose';

const passSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  passType: { type: String, enum: ['Student', 'Monthly', 'Weekly'], required: true },
  idProof: { type: String, required: true }, // Image path or URL
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Expired'], default: 'Pending' },
  validFrom: { type: Date },
  validUntil: { type: Date },
  qrCode: { type: String }, // Base64 QR code or URL
  passId: { type: String, unique: true, sparse: true }
}, { timestamps: true });

const Pass = mongoose.model('Pass', passSchema);
export default Pass;
