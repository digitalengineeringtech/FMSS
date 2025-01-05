import mongoose from "mongoose";
import { Schema } from "mongoose";
import moment from "moment-timezone";
import { formatDecimal, virtualFormat } from '../utils/helper';
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

const currentDate = moment().tz("Asia/Yangon").format("YYYY-MM-DD");

export interface fuelInDocument extends mongoose.Document {
  stationDetailId: string;
  driver: string;
  tankNo: string;
  bowser: string;
  fuel_type: string;
  fuel_in_code: number;
  tank_balance: number;
  opening: number,
  terminal: string;
  current_balance: number,
  send_balance: number,
  receive_balance: number;
  receive_date: string;
  asyncAlready: string;
}

const fuelInSchema = new Schema({
  stationDetailId: {
    type: Schema.Types.ObjectId,
    ref: "stationDetail",
    // default: "6464e9f1c45b82216ab1db6b",
  },
  driver: { type: String, required: true },
  bowser: { type: String, required: true },
  tankNo: { type: String, required: true },
  fuel_type: { type: String, required: true },
  fuel_in_code: { type: Number, required: true },
  tank_balance: { type: Number, required: true },
  opening: { type: Number },
  terminal:  { type: String, required: true },
  current_balance: { type: Number },
  send_balance: { type: Number },
  receive_balance: { type: Number },
  receive_date: { type: String, default: new Date() },
  createAt: { type: Date, default: new Date() },
  asyncAlready: { type: String, required: true },
});

// Add virtual formatting for specific fields
virtualFormat(fuelInSchema, [
  "tank_balance",
  "opening",
  "current_balance",
  "send_balance",
  "receive_balance",
]);


fuelInSchema.pre("save", function (next) {
  const options = { timeZone: "Asia/Yangon", hour12: false };

  const currentDate = moment().tz("Asia/Yangon").format("YYYY-MM-DD");
  const currentDateTime = new Date().toLocaleTimeString("en-US", options);

  let iso: Date = new Date(`${currentDate}T${currentDateTime}.000Z`);

  this.createAt = iso;
  this.receive_date = currentDate;
  next();
});

const fuelInModel = mongoose.model<fuelInDocument>("fuelIn", fuelInSchema);

export default fuelInModel;
