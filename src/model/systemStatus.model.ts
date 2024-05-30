import mongoose, { Schema } from "mongoose";

export interface systemStatusDocument extends mongoose.Document {
  id: string;
  mode: string;
}

const systemStatusSchema = new Schema({
  id: { type: String, required: true, default: "1" },
  mode: { type: String, required: true, enum: ["allow", "dead"] },
});

const systemStatusModel = mongoose.model<systemStatusDocument>(
  "systemStatus",
  systemStatusSchema
);

export default systemStatusModel;
