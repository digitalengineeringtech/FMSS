import mongoose, { Schema } from "mongoose";

export interface reportByFuelTypeDocument {
  fuelType: string;
  saleLiter: number;
  totalPrice: number;
}

export interface totalStatementDocument extends mongoose.Document {
  dateOfDay: string;
  reportByFuelType: reportByFuelTypeDocument[];
  isDone: boolean;
}

const totalStatementSchema = new Schema({
  dateOfDay: {
    type: String,
    default: new Date().toLocaleDateString(`fr-CA`),
    unique: true,
  },
  reportByFuelType: [
    {
      fuelType: String,
      saleLiter: Number,
      totalPrice: Number,
    },
  ],
  isDone: { type: Boolean, default: false },
});

export const totalStatementModel = mongoose.model<totalStatementDocument>(
  "totalStatement",
  totalStatementSchema
);
