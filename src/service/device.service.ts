import { FilterQuery } from "mongoose";
import deviceModel, { deviceDocument } from "../model/device.model";
import { UpdateQuery } from "mongoose";

export const getDevice = async (query: FilterQuery<deviceDocument>) => {
  try {
    return await deviceModel.find(query).lean();
  } catch (e) {
    throw new Error(e);
  }
};

export const getDeviceByNozzle = async (query: FilterQuery<deviceDocument>) => {
  try {
    return await deviceModel.findOne(query).lean();
  } catch (e) {
    throw new Error(e);
  }
}

export const getDeviceCount = async () => {
  try {
    return await deviceModel.countDocuments();
  } catch (e) {
    throw new Error(e);
  }
};

export const addDevice = async (body: deviceDocument) => {
  try {
    return await new deviceModel(body).save();
  } catch (e) {
    throw new Error(e);
  }
};

export const deleteDevice = async (query: FilterQuery<deviceDocument>) => {
  try {
    return await deviceModel.deleteMany(query);
  } catch (e) {
    throw new Error(e);
  }
};

export const updateDevice = async (
  query: FilterQuery<deviceDocument>,
  body: UpdateQuery<deviceDocument>
) => {
  try {
    const device = await deviceModel.find(query).lean();

    if(!device) {
       throw new Error("Device not found");  
    }

    if(device[0].autoApprove == true || device[0].semiApprove == true) {
        throw new Error("Device can't be updated both auto approve and semi approve is true");
    }

    await deviceModel.updateMany(query, body);

    return await deviceModel.find().lean();
  } catch (e) {
    throw new Error(e);
  }
};

export const countDevice = async () => {
  try {
    return await deviceModel.countDocuments();
  } catch (e) {
    throw new Error(e);
  }
};
