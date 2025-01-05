import mongoose, { Schema } from "mongoose";
import moment, { MomentTimezone } from "moment-timezone";
import { virtualFormat } from "../utils/helper";

export interface fuelBalanceDocument extends mongoose.Document {
  stationId: string;
  fuelType: string;
  capacity: string;
  terminal: number;
  opening: number;
  fuelIn: number;
  tankNo: number;
  cash: number;
  credit: number;
  balance: number;
  todayTank: number;
  realTime: Date;
  nozzles: [];
  createAt: string;
}

const fuelBalanceSchema = new Schema({
  stationId: {
    type: Schema.Types.ObjectId,
    // ref: "stationDetail",
  },
  fuelType: { type: String, required: true },
  capacity: { type: String, required: true },
  terminal: { type: Number, default: 0 },
  opening: { type: Number, default: 0 },
  tankNo: { type: Number, require: true },
  fuelIn: { type: Number, default: 0 },
  cash: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  todayTank: { type: Number, default: 0},
  nozzles: { type: Array, default: [] },
  realTime: { type: Date, default: new Date() },
  createAt: { type: String, default: new Date().toLocaleDateString(`fr-CA`) },
});

virtualFormat(fuelBalanceSchema, [
  'terminal',
  'opening',
  'fuelIn',
  'balance',
  'todayTank'
]);

fuelBalanceSchema.pre("save", function (next) {
  const options = { timeZone: "Asia/Yangon", hour12: false };

  const currentDate = moment().tz("Asia/Yangon").format("YYYY-MM-DD");

  const currentDateTime = new Date().toLocaleTimeString("en-US", options);

  let iso: Date = new Date(`${currentDate}T${currentDateTime}.000Z`);

  this.realTime = iso;
  this.createAt = currentDate;
  next();
});

const fuelBalanceModel = mongoose.model<fuelBalanceDocument>(
  "fuelBalance",
  fuelBalanceSchema
);

export default fuelBalanceModel;
