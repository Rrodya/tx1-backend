import mongoose, { Document } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2"

export const DriveSchema = new mongoose.Schema({
  passengers_id: [{ type: mongoose.Schema.Types.ObjectId, ref: "User"}],
  book_id: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book"}],
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  seats: { type: Number, default: 1 },
  booked_seats  : { type: Number, default: 0},
  from: { type: String, default: null }, 
  to: { type: String, default: null }, 
  status: { type: Number, default: 0 }, 
  date_start: { type: Number, default: null },
  price: { type: Number, default: null },
  description: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("Drive", DriveSchema);