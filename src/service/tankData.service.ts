import { FilterQuery, UpdateQuery } from "mongoose";
import tankDataModel, { tankDataDocument } from "../model/tankData.model";
import config from "config";
import axios from "axios";
import moment from "moment-timezone";
import logger from "../utils/logger";

export const getTankData = async (query: FilterQuery<tankDataDocument>) => {
  try {
    return await tankDataModel.find(query).lean().select("-__v");
  } catch (e) {
    throw new Error(e);
  }
};

export const getTankDataCount = async () => {
  try {
    return await tankDataModel.countDocuments();
  } catch (e) {
    throw new Error(e);
  }
};

export const addTankData = async (body) => {
  try {
    let url = config.get<string>("tankDataUrl");
    let tankRealTimeData = await axios.post(url);

    // console.log(
    //   tankRealTimeData,
    //   ".........this is tank realtime data................"
    // );



    let saveData = {
      ...body,
      asyncAlready: "0",
      data: tankRealTimeData.data.data,
      // data: fakedata,
    };

    await new tankDataModel(saveData).save();

    let uploadData = await getTankData({
      stationDetailId: body.stationDetailId,
      dateOfDay: moment().format("YYYY-MM-DD"),
    });

    if (uploadData.length == 0) return;

    try {
      let url = config.get<string>("tankDataCloudUrl");

      let response = await axios.post(url, uploadData[0]);

      // if (response.status == 200) {
      //   await tankDataModel.findByIdAndUpdate(uploadData[0]._id, {
      //     asyncAlready: "2",
      //   });
      // }
    } catch (e) {
      console.log(e.message, "error from add tank data");
    }
  } catch (e) {
    throw new Error(e);
  }
};
export const updateExistingTankData = async (body) => {
  try {
    let url = config.get<string>("tankDataUrl");
    let tankRealTimeData = await axios.post(url);
    
    const updateData = {
      ...body,
      //  syncAlready: "0",
      data: tankRealTimeData.data.data,
    };

    await tankDataModel.findByIdAndUpdate(body.id, updateData);

    const uploadData = await getTankData({
      // asyncAlready: "0",
      _id: body.id,
    });

    if (uploadData.length == 0) return;

    try {
      let url = config.get<string>("tankDataCloudUrl");

      await axios.post(url, uploadData[0]);
    } catch (e) {
      console.log(e.response, "from add tank data");
    }
  } catch (error) {
    throw new Error(error);
  }
};

export const updateTankData = async (
  query: FilterQuery<tankDataDocument>,
  body: UpdateQuery<tankDataDocument>
) => {
  try {
    await tankDataModel.updateMany(query, body);
    return await tankDataModel.find(query).lean();
  } catch (e) {
    throw new Error(e);
  }
};

export const deleteTankData = async (query: FilterQuery<tankDataDocument>) => {
  try {
    let TankData = await tankDataModel.find(query);
    if (!TankData) {
      throw new Error("No TankData with that id");
    }

    return await tankDataModel.deleteMany(query);
  } catch (e) {
    throw new Error(e);
  }
};

export const tankDataPaginate = async (
  pageNo: number,
  query: FilterQuery<tankDataDocument>
): Promise<{ count: number; data: tankDataDocument[] }> => {
  const limitNo = config.get<number>("page_limit");
  const reqPage = pageNo == 1 ? 0 : pageNo - 1;
  const skipCount = limitNo * reqPage;

  console.log(query, ".................................................");

  const data = await tankDataModel
    .find(query)
    .sort({ createAt: -1 })
    .skip(skipCount)
    .limit(limitNo)
    .lean()
    .select("-__v");

  const count = await tankDataModel.countDocuments(query);

  return { count, data };
};
