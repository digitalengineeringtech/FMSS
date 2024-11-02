import mongoose, { Schema } from "mongoose";

export interface creditReturnDocument extends mongoose.Document {
    cutomerCreditId: string;
    vocono: string;
    returnAmount: number;
    returnDate: Date;
    creditAmount: number;
    creditDueDate: Date;
    isPaid: boolean;
    createdAt: Date;
}

const creditReturnSchema = new Schema({
    cutomerCreditId: { type: Schema.Types.ObjectId, ref: 'customerCredit' },
    vocono: { type: String, required: true },
    returnAmount: { type: Number },
    returnDate: { type: Date },
    creditAmount: { type: Number, required: true },
    creditDueDate: { type: Date },
    isPaid: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

const creditReturnModel = mongoose.model<creditReturnDocument>(
    "creditReturn",
    creditReturnSchema
);
export default creditReturnModel;