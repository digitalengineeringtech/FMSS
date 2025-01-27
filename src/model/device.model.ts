import mongoose, { Schema } from "mongoose";

export interface deviceDocument extends mongoose.Document {
  dep_no: string;
  dep_type: string;
  nozzle_no: string;
  fuel_type: string;
  daily_price: number;
  autoApprove: boolean;
  semiApprove: boolean;
}

const deviceSchema = new Schema(
  {
    dep_no: { type: String, require: true }, //1
    dep_type: { type: String, require: true, enum: ["prime", "tatsuno"] },
    nozzle_no: { type: String, required: true, unique: true }, //5
    fuel_type: { type: String, required: true },
    daily_price: { type: Number, default: 0 },
    status: { type: String, default: "enable", enum: ["enable", "disable"] },
    autoApprove: { type: Boolean, default: false },
    semiApprove: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const deviceModel = mongoose.model<deviceDocument>("device", deviceSchema);

export default deviceModel;
