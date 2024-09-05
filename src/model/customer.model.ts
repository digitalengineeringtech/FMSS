import mongoose, { Schema } from "mongoose";

export interface customerDocument extends mongoose.Document {
  cusName: string;
  cusCardId: string;
  cusId: string;
  cusVehicleType: string;
  cusCarNo: string;
  limitAmount: number;
  cusDebLiter: number;
  cusDebAmount: number;
}

const customerSchema = new Schema({
  cusName: { type: String, required: true },
  cusCardId: { type: String, required: true },
  cusId: { type: String, required: true },
  cusVehicleType: { type: String, required: true },
  cusCarNo: { type: String, required: true },
  limitAmount: { type: Number, default: 0 },
  cusDebLiter: { type: Number, default: 0 },
  cusDebAmount: { type: Number, default: 0 },
});

const customerModel = mongoose.model<customerDocument>(
  "customer",
  customerSchema
);
export default customerModel;
