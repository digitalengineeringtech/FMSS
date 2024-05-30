import { FilterQuery } from "mongoose";
import fuelInModel, { fuelInDocument } from "../model/fuelIn.model";
import config from "config";

export const getFuelIn = async (query: FilterQuery<fuelInDocument>) => {
  try {
    return await fuelInModel.find(query).lean().select("-__v");
  } catch (e) {
    throw new Error(e);
  }
};

export const fuelInPaginate = async (
  pageNo: number,
  query: FilterQuery<fuelInDocument>
): Promise<{ count: number; data: fuelInDocument[] }> => {
  const limitNo = config.get<number>("page_limit");
  const reqPage = pageNo == 1 ? 0 : pageNo - 1;
  const skipCount = limitNo * reqPage;
  const data = await fuelInModel
    .find(query)
    .sort({ createAt: -1 })
    .skip(skipCount)
    .limit(limitNo)
    .lean()
    .select("-__v");

  const count = await fuelInModel.countDocuments(query);

  return { count, data };
};

export const addFuelIn = async (body: fuelInDocument) => {
  let { driver, bowser, fuel_type, recive_balance } = body;

  if (!driver || !bowser || !fuel_type)
    throw new Error("you need one field");
  let result = await new fuelInModel(body).save();
  return result;
};

export const deleteFuelIn = async (query: FilterQuery<fuelInDocument>) => {
  try {
    let FuelIn = await fuelInModel.find(query);
    if (!FuelIn) {
      throw new Error("No FuelIn with that id");
    }
    return await fuelInModel.deleteMany(query);
  } catch (e) {
    throw new Error(e);
  }
};
