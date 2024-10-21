import mongoose, { Schema } from "mongoose";

export interface customerDocument extends mongoose.Document {
  cusName: string;
  cusPhone: string;
  cusType: string;
  cusVehicleType: string;
  cusCarNo: string;
  cusDebLiter: number;
  cusDebAmount: number;
}

const customerSchema = new Schema({
  cusName: { type: String, required: true },
  cusPhone: { type: String, required: true },
  cusType: { type: String, required: true }, // credit or debit
  cusCardId: { type: String },
  cusVehicleType: { type: String, required: true },
  cusCarNo: { type: String, required: true },
  cusDebLiter: { type: Number, default: 0 },
  cusDebAmount: { type: Number, default: 0 },
});

const customerModel = mongoose.model<customerDocument>(
  "customer",
  customerSchema
);
export default customerModel;
