import mongoose, { Schema } from "mongoose";

export interface stationDocument extends mongoose.Document {
    name: string;
    image: string;
    phoneOne: string;
    phoneTwo: string;
}

const stationSchema = new Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    phoneOne: { type: String, required: true },
    phoneTwo: { type: String, required: true },
    createAt: { type: Date, default: Date.now },
});

const stationModel = mongoose.model<stationDocument>("station", stationSchema);

export default stationModel