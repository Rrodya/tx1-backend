import mongoose from "mongoose";
import { RolesEnum } from "../enums";

const Role = new mongoose.Schema({
  value: {type: String, unique: true, default: RolesEnum.USER}
})

export default mongoose.model("Role", Role);