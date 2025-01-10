import { FilterQuery } from "mongoose";
import stationModel, { stationDocument } from "../model/station.model";

export const getStations = async () => {
    return await stationModel.findOne().sort({ _id: -1, createAt: -1 });
};

export const getStation = async (query: FilterQuery<stationDocument>) => {
    return await stationModel.findOne(query).sort({ _id: -1, createAt: -1 });
}

export const addStation = async (body: stationDocument) => {
    return await new stationModel(body).save();
};

export const updateStation = async (query: FilterQuery<stationDocument>,body: stationDocument) => {
    return await stationModel.updateOne(query,body);
}

export const deleteStation = async (query: FilterQuery<stationDocument>) => {
    return await stationModel.deleteOne(query);
}


