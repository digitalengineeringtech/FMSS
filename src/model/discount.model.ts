import mongoose, { Schema } from "mongoose";

export interface discountDocument extends mongoose.Document {
    type: string; // amount or percentage
    amount: number;
    percent: number;
}

const discountSchema = new Schema({
    type: { type: String, required: true }, // amount or percentage
    amount: { type: Number, default: 0 }, 
    percent: { type: Number, default: 0 }, // 5% or 10%
});

const discountModel = mongoose.model<discountDocument>(
    "discount",
    discountSchema
  );
  export default discountModel;