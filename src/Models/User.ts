import mongoose from "mongoose";
import Drive from "./Drive"

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  name: { type: String, required: false, default: null }, 
  password: { type: String, required: true },
  roles: [{ type: String, ref: "Role" }],
  booked_drives: [{ type: mongoose.Schema.Types.ObjectId, ref: "Drive" }],
  my_drives: [{ type: mongoose.Schema.Types.ObjectId, ref: "Drive" }]
})

export default mongoose.model("User", UserSchema);

