import mongoose, { Schema } from "mongoose";

export interface customerCreditDocument extends mongoose.Document {
     creditType: string;
     creditDueDate: Date;
     limitAmount: number;
     createdAt: Date;
     customer: string;
}

const customerCreditSchema = new Schema({
  creditType: { type: String, required: true }, // LimitByAmount or LimitByDate
  creditDueDate: { type: Date, required: true },
  limitAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  customer: { type: Schema.Types.ObjectId, ref: 'customer' },
});

const customerCreditModel = mongoose.model<customerCreditDocument>(
  "customerCredit",
  customerCreditSchema
);
export default customerCreditModel;