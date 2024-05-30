import mongoose, { Schema } from "mongoose";

export interface fuelInDocument extends mongoose.Document {
  driver: string;
  bowser: string;
  fuel_type: string;
  recive_balance: number;
  receive_date: string;
}

const fuelInSchema = new Schema({
  driver: { type: String, required: true },
  bowser: { type: String, required: true },
  fuel_type: { type: String, required: true },
  receiveAmount: { type: Number, required: true },
  receive_date: {
    type: String,
    default: new Date().toLocaleDateString("fr-CA"),
  },
});

const fuelInModel = mongoose.model<fuelInDocument>("fuelIn", fuelInSchema);

export default fuelInModel;
