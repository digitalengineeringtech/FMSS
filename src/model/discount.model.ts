import mongoose, { Schema } from "mongoose";

export interface discountDocument extends mongoose.Document {
    type: string; // amount or percentage
    amount: number;
    isActive: boolean;
}

const discountSchema = new Schema({
    type: { type: String, required: true }, // amount or percentage
    amount: { type: Number, required: true }, // if type == amount then amount else percentage number
    isActive: { type: Boolean, default: false },
});

const discountModel = mongoose.model<discountDocument>(
    "discount",
    discountSchema
  );
  export default discountModel;