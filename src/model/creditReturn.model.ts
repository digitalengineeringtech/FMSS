import mongoose, { Schema } from "mongoose";

export interface creditReturnDocument extends mongoose.Document {
    createdAt: Date;
    returnDate: Date;
    vocono: string;
    creditAmount: number;
    returnAmount: number;
    creditDueDate: Date;
}

const creditReturnSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    returnDate: { type: Date, default: Date.now },
    vocono: { type: String, required: true },
    creditAmount: { type: Number, required: true },
    returnAmount: { type: Number, required: true },
    creditDueDate: { type: Date, required: true },
});

const creditReturnModel = mongoose.model<creditReturnDocument>(
    "creditReturn",
    creditReturnSchema
);
export default creditReturnModel;