import mongoose from "mongoose";
import { Schema } from "mongoose";
import connectDbs, { externalDbConnect } from "../utils/connect";
import { stationDetailDocument } from "./stationDetail.model";

const controlDb = externalDbConnect("controlDbUrl");

export interface collectionDocument extends mongoose.Document {
  collectionName: string;
  stationCollection: stationDetailDocument["_id"];
  stationImg: string;
  permission: string;
}

const collectionSchema = new Schema({
  collectionName: { type: String, required: true, unique: true },
  stationCollection: [
    {
      stationId: { type: String, required: true },
      stationName: { type: String, required: true },
    },
  ],
  stationImg: { type: String, required: true, unique: true },
  permission: [],
});

const collectionModel = controlDb.model<collectionDocument>(
  "collection",
  collectionSchema
);
export default collectionModel;
