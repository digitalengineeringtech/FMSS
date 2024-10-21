import mongoose, { Schema } from "mongoose";

export interface customerCreditDocument extends mongoose.Document {
     customer: string;
     creditType: string;
     creditDueDate: Date;
     limitAmount: number;
     createdAt: Date;
}

const customerCreditSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'customer' },
  creditType: { type: String, required: true }, // LimitByAmount or LimitByDate
  creditDueDate: { type: Date },
  limitAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const customerCreditModel = mongoose.model<customerCreditDocument>(
  "customerCredit",
  customerCreditSchema
);
export default customerCreditModel;