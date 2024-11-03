import mongoose, { Schema } from "mongoose";

export interface creditReturnDocument extends mongoose.Document {
    vocono: string;
    returnAmount: number;
    returnDate: Date;
    creditAmount: number;
    creditDueDate: Date;
    isPaid: boolean;
    createdAt: Date;
    customerCredit: string;
}

const creditReturnSchema = new Schema({
    vocono: { type: String, required: true },
    returnAmount: { type: Number },
    returnDate: { type: Date },
    creditAmount: { type: Number, required: true },
    creditDueDate: { type: Date },
    isPaid: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    customerCredit: { type: Schema.Types.ObjectId, ref: 'customerCredit' },
});

const creditReturnModel = mongoose.model<creditReturnDocument>(
    "creditReturn",
    creditReturnSchema
);
export default creditReturnModel;