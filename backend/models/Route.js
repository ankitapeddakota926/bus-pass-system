import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  routeName: { type: String, required: true },
  busNumber: { type: String, required: true },
  stops: { type: [String], required: true },
  fare: { type: Number, required: true }
}, { timestamps: true });

const Route = mongoose.model('Route', routeSchema);
export default Route;
