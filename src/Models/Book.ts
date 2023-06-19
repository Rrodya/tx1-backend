import mongoose, { Document } from "mongoose";

export const BookSchema = new mongoose.Schema({
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  drive_id: { type: mongoose.Schema.Types.ObjectId, ref: "Drive" },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  seats: { type: Number, default: 1 },
  description: { type: String, default: null },
});

export default mongoose.model("Book", BookSchema);