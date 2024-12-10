import mongoose, { Schema } from "mongoose";

export interface mptaDocument extends mongoose.Document {
   nozzleNo: string;
   depNo: string;
   carNo: string;
   shopCode: string;
   liter: number;
   amount: number;
   vehicleTypeId: string;
   vehicleType: string;
}

const mptaSchema = new Schema({
   nozzleNo: { type: String, required: true },
   depNo: { type: String, required: true },
   carNo: { type: String },
   shopCode: { type: String, required: true },
   liter: { type: Number, required: true },
   amount: { type: Number, required: true },
   vehicleTypeId: { type: String },
   vehicleType: { type: String },
});

const mptaModel = mongoose.model<mptaDocument>(
    "mpta",
    mptaSchema
);

export default mptaModel;