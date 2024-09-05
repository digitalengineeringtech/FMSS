import stationModel, { stationDocument } from "../model/station.model";

export const getStation = async () => {
    return await stationModel.findOne().sort({ _id: -1, createAt: -1 });
};

export const addStation = async (body: stationDocument) => {
    return await new stationModel(body).save();
};


