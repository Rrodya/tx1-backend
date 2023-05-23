import mongoose from "mongoose";

export const DriveSchema = new mongoose.Schema({
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User"},
  passenger_id: { type: mongoose.Schema.Types.ObjectId, ref: "User"},
  from_address: { type: String, default: null }, 
  to_address: { type: String, default: null }, 
  status: { type: Number, default: 0 }, 
  date_start: { type: Date, default: null },
  date_end: { type: Date, default: null },
  price: { type: Number, default: null },
  distance: { type: Number, default: null },
});

export default mongoose.model("Drive", DriveSchema);