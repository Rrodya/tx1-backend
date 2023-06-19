import mongoose from "mongoose";

export const PassengerSchema = new mongoose.Schema({
  drive_id: { type: mongoose.Schema.Types.ObjectId, ref: "Drive" },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User"},
  
})

export default mongoose.model("Passenger", PassengerSchema)