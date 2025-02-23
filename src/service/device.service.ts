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
    const device = await deviceModel.findOne(query).lean();

    if(!device) throw new Error("No device found with that id");

    // Check if device.autoApprove is true and body.semiApprove is being set to true
    if (device.autoApprove && body.semiApprove === true) {
      throw new Error("You cannot set autoApprove and semiApprove at the same time");
    }

    // Check if device.semiApprove is true and body.autoApprove is being set to true
    if (device.semiApprove && body.autoApprove === true) {
      throw new Error("You cannot set autoApprove and semiApprove at the same time");
    }
    
    await deviceModel.updateOne(query, body);

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
