import mongoose, { Schema } from "mongoose";

export interface customerDocument extends mongoose.Document {
  cusName: string;
  cusPhone: string;
  cusVehicleType: string;
  cusCarNo: string;
}

const customerSchema = new Schema({
  cusName: { type: String, required: true },
  cusPhone: { type: String, required: true },
  cusCardId: { type: String },
  cusVehicleType: { type: String, required: true },
  cusCarNo: { type: String, required: true },
});

const customerModel = mongoose.model<customerDocument>(
  "customer",
  customerSchema
);
export default customerModel;
