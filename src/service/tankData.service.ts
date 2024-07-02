import { FilterQuery, UpdateQuery } from "mongoose";
import tankDataModel, { tankDataDocument } from "../model/tankData.model";
import config from "config";
import axios from "axios";

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
    const fakedata = {
      data: {
        data: [
          {
            stateInfo: "No alarm",
            oilType: "Petrol 92",
            weight: 0,
            level: 2222,
            oilRatio: 0.3333,
            waterRatio: 0,
            canAddOilWeight: 0,
            temperature: 32.33,
            volume: 333,
            connect: 3,
            id: 1,
          },
          {
            stateInfo: "No alarm",
            oilType: "Diesel",
            weight: 0,
            level: 2222,
            oilRatio: 0.3333,
            waterRatio: 0,
            canAddOilWeight: 0,
            temperature: 32.33,
            volume: 333,
            connect: 3,
            id: 2,
          },
          {
            stateInfo: "No alarm",
            oilType: "95 Octane",
            weight: 0,
            level: 2222,
            oilRatio: 0.3333,
            waterRatio: 0,
            canAddOilWeight: 0,
            temperature: 32.33,
            volume: 333,
            connect: 3,
            id: 3,
          },
          {
            stateInfo: "No alarm",
            oilType: "Super Diesel",
            weight: 0,
            level: 2222,
            oilRatio: 0.3333,
            waterRatio: 0,
            canAddOilWeight: 0,
            temperature: 32.33,
            volume: 333,
            connect: 3,
            id: 4,
          },
        ],
      },
    };
    let url = config.get<string>("tankDataUrl");
    let tankRealTimeData = url ? await axios.post(url) : fakedata;

    console.log(
      tankRealTimeData,
      ".........this is tank realtime data................"
    );

    let saveData = {
      ...body,
      asyncAlready: "0",
      data: tankRealTimeData.data.data,
      // data: fakedata,
    };

    await new tankDataModel(saveData).save();

    let uploadData = await getTankData({
      asyncAlready: "0",
    });

    if (uploadData.length == 0) return;

    for (const ea of uploadData) {
      try {
        let url = config.get<string>("tankDataCloudUrl");
        let response = await axios.post(url, ea);
        // let get = await axios.get(url);
        // console.log(get, "this is get");
        if (response.status == 200) {
          await tankDataModel.findByIdAndUpdate(ea._id, {
            asyncAlready: "2",
          });
        }
      } catch (e) {
        console.log(e.response, "from add tank data");
      }
    }
  } catch (e) {
    throw new Error(e);
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
