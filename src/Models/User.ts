import mongoose from "mongoose";
import { DriveSchema } from "./Drive";

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  name: { type: String, required: false, default: null }, 
  password: { type: String, required: true },
  roles: [{ type: String, ref: "Role" }],
  status: { type: Number, required: false, default: 0 }, 
  car: { type: String, default: null },
  drives: [{ type: mongoose.Schema.Types.ObjectId, ref: "Drive"}],
})

export default mongoose.model("User", UserSchema);

