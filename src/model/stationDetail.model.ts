import mongoose, {Connection, Schema} from "mongoose";
import connectDbs, { externalDbConnect } from "../utils/connect";


const kyawsanDb : Connection = externalDbConnect("kyawsan_DbUrl");
const commonDb : Connection = externalDbConnect("common_DbUrl");

export interface stationDetailDocument extends mongoose.Document {
  name: string;
  location: string;
  lienseNo: string;
  deviceCount: number;
  nozzleCount: number;
  tankCount: number;
  permission:[],
  startDate: Date;
  expireDate: Date;
}

const stationDetailSchema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true, unique: true },
  lienseNo: { type: String, required: true, unique: true },
  deviceCount: { type: Number, required: true },
  nozzleCount: { type: Number, required: true },
  tankCount: { type: Number, required: true},
  permission:[],
  startDate: { type: Date, required: true },
  expireDate: { type: Date, required: true }
});

const ksStationDetailModel = kyawsanDb.model<stationDetailDocument>(
  "stationDetail",
  stationDetailSchema
);

const csStationDetailModel = commonDb.model<stationDetailDocument>(
  "stationDetail",
  stationDetailSchema
);

export {ksStationDetailModel , csStationDetailModel };
