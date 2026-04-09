import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  college: { type: String, required: true },
  course: { type: String, required: true },
  year: { type: String, required: true },
  address: { type: String, required: true },
  route: { type: String, required: true },

  // APSRTC pass rules fields
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  distanceKm: { type: Number, required: true },
  passDuration: { type: String, enum: ['Monthly', 'Quarterly', 'Annual'], default: 'Monthly' },
  passCategory: { type: String, enum: ['Free', 'Concessional'], default: 'Concessional' },
  areaType: { type: String, enum: ['City', 'Mofussil'], default: 'Mofussil' },

  documents: {
    applicationForm: { type: String, required: true },
    bonaFideCertificate: { type: String, required: true },
    aadhaarCard: { type: String, required: true },
    feeReceipt: { type: String, required: true },
    photograph: { type: String, required: true },
    casteCertificate: { type: String },
    previousIdCard: { type: String },
  },
  passType: { type: String, default: 'Student' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Correction', 'Expired'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Free'], default: 'Pending' },
  rejectionReason: { type: String },
  generatedPassId: { type: String, unique: true, sparse: true },
  validFrom: { type: Date },
  validUntil: { type: Date },
  qrCode: { type: String },
}, { timestamps: true });

export default mongoose.model('BusPassApplication', applicationSchema);
