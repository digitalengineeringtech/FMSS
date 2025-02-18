import { FilterQuery, UpdateQuery } from "mongoose";
import fuelInModel, { fuelInDocument } from "../model/fuelIn.model";
import { addFuelBalance, getFuelBalance, updateFuelBalance } from "./fuelBalance.service";
import config, { get } from "config";
import axios from "axios";
import { log } from "console";
import { fuelBalanceDocument } from "../model/fuelBalance.model";

const limitNo = config.get<number>("page_limit");

export const getFuelIn = async (query: FilterQuery<fuelInDocument>) => {
  try {
    const fuelins = await fuelInModel.find(query).lean({ virtuals: true});

    return fuelins;
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
    .lean({ virtuals: true })
    .select("-__v");

  const count = await fuelInModel.countDocuments(query);

  return { count, data };
};

export const addFuelIn = async (body: any) => {
  try {
    let no = await fuelInModel.count();
    let tankCondition = await getFuelBalance({
      stationId: body.user.stationId,
      fuel_type: body.fuelType,
      tankNo: body.tankNo,
      createAt: body.receive_date,
    });

    const updatedBody = {
      ...body,
      stationDetailId: body.user.stationId,
      fuel_in_code: no + 1,
      terminal: body.terminal,
      tank_balance: Number(tankCondition[0]?.balance ?? 0),
      current_balance: Number(tankCondition[0]?.balance ?? 0) + Number(body.receive_balance ?? 0),
      send_balance: Number(body.send_balance ?? 0),
      receive_balance: Number(body.receive_balance ?? 0),
    };

    let result = await new fuelInModel(updatedBody).save();

    await updateFuelBalance(
      { _id: tankCondition[0]._id },
      { 
          fuelIn: Number(body.receive_balance ?? 0),
          terminal: body.terminal, 
          balance: Number(tankCondition[0]?.balance ?? 0) + Number(body.receive_balance ?? 0)
      }
    );

    const url = config.get<string>("fuelInCloud");

    // console.log("===up=================================");
    // console.log(updatedBody);
    // console.log("===up=================================");

    try {
      const cloudObject = {
         stationId: result?.stationDetailId,
         driver: result?.driver,
         bowser: result?.bowser,
         tankNo: result?.tankNo,
         fuel_type: result?.fuel_type,
         fuel_in_code: result?.fuel_in_code,
         tank_balance: result?.tank_balance,
         opening: result?.opening,
         terminal: result?.terminal,
         current_balance: result?.current_balance,
         send_balance: result?.send_balance,
         receive_balance: result?.receive_balance,
         receive_date: result?.receive_date,
         createAt: result?.receive_date
      }

      let response = await axios.post(url, cloudObject);

      if (response.status == 200) {
        await fuelInModel.findByIdAndUpdate(result._id, {
          asyncAlready: "2",
        });
      } else {
        console.log("error is here fuel in");
      }
    } catch (error) {
      console.log("errr", error);
      if (error.response && error.response.status === 409) {
      } else {
      }
    }

    return result;
  } catch (e) {
    throw new Error(e);
  }
};

export const updateFuelIn = async (
  query: FilterQuery<fuelInDocument>,
  body: UpdateQuery<fuelInDocument>
) => {
  try {
    await fuelInModel.updateMany(query, body);
    return await fuelInModel.find(query).lean();
  } catch (e) {
    throw new Error(e);
  }
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

export const fuelInByDate = async (
  query: FilterQuery<fuelInDocument>,
  d1: Date,
  d2: Date,
  pageNo: number
): Promise<{ count: number; data: fuelInDocument[] }> => {
  const reqPage = pageNo == 1 ? 0 : pageNo - 1;
  const skipCount = limitNo * reqPage;

  const filter: FilterQuery<fuelInDocument> = {
    ...query,
    createAt: {
      $gt: d1,
      $lt: d2,
    },
  };

  const data = await fuelInModel
    .find(filter)
    .sort({ createAt: -1 })
    .skip(skipCount)
    .limit(limitNo)
    .lean({ virtuals: true })
    .select("-__v");

  const count = await fuelInModel.countDocuments(filter);
  return { data, count };
};

export const addAtgFuelIn = async (body: any) => {
  try {
    let no = await fuelInModel.count();

    let tankUrl = config.get<string>("tankDataUrl");

    let tankRealTimeData = await axios.post(tankUrl);

    const tank = tankRealTimeData.data.data.find((ea) => ea.id == body.tankNo);

    const oilType = tank?.oilType;

    const opening = tank?.volume;

    let fuel_type;

    if (oilType == "Petrol 92") {
      fuel_type = "001-Octane Ron(92)";
    } else if (oilType == "95 Octane") {
      fuel_type = "002-Octane Ron(95)";
    } else if (oilType == "HSD" || oilType == 'Diesel') {
      fuel_type = "004-Diesel";
    } else if (oilType == "PHSD" || oilType == 'Super Diesel') {
      fuel_type = "005-Premium Diesel";
    }

    const fuelInObject = {
      stationDetailId: body.stationDetailId,
      driver: body.driver,
      bowser: body.bowser,
      tankNo: body.tankNo,
      fuel_type: fuel_type,
      fuel_in_code: no + 1,
      terminal: body.terminal,
      send_balance: body.send_balance,
      opening: opening,
      current_balance: opening,
      tank_balance: 0,
      receive_balance: 0,
      receive_date: new Date("YYYY-MM-DD"),
      asyncAlready: 0,
    };

    let result = await new fuelInModel(fuelInObject).save();

    return result;
  } catch (e) {
    console.log(e);
  }
};

export const updateAtgFuelIn = async (body: any) => {
  
  try {
    let tankUrl = config.get<string>("tankDataUrl");

    let tankRealTimeData = await axios.post(tankUrl);

    const tank = tankRealTimeData.data.data.find((ea) => ea.id == body.tankNo);

    const fuelIn = await fuelInModel.findOne({ _id: body.id });

    if (!fuelIn) {
      throw new Error("fuelIn document not found for the given ID");
    }

    const closing = tank?.volume;

    const opening = fuelIn?.opening;

    await fuelInModel.findByIdAndUpdate(body.id, {
      tank_balance: closing,
      receive_balance: closing - opening,
      current_balance: closing,
    });

    const result = await fuelInModel.findById(body.id);

    try {
      const url = config.get<string>("atgFuelInCloud");

      const cloudObject = {
        stationId: result?.stationDetailId,
        driver: result?.driver,
        bowser: result?.bowser,
        tankNo: result?.tankNo,
        fuel_type: result?.fuel_type,
        fuel_in_code: result?.fuel_in_code,
        tank_balance: result?.tank_balance,
        opening: result?.opening,
        terminal: result?.terminal,
        current_balance: result?.current_balance,
        send_balance: result?.send_balance,
        receive_balance: result?.receive_balance,
        receive_date: result?.receive_date,
        createAt: result?.receive_date
     }

      const response = await axios.post(url, cloudObject);

      if (response.status === 200) {
        await fuelInModel.findOneAndUpdate(body.id, {
          asyncAlready: 2,
        });
      } else {
        throw new Error("Cloud not connected");
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }

    return result;
  } catch (error) {
    console.log(error);
  }
};

export const calculateFuelBalance = async (
  body: any,
) => {
  try {
    const checkDate = await getFuelBalance({
      stationId: body.stationId,
      createAt: body.createAt
    });

    if(checkDate.length == 0) {
      let prevResult = await getFuelBalance(
        {
          stationId: body.stationId,
        },
        body.tankCount
      );

      await Promise.all(
        prevResult
          .reverse()
          // .slice(0, tankCount)
          .map(async (ea) => {
            // console.log('fuelBalance', ea);
            let obj: fuelBalanceDocument;
            if (ea.balance == 0) {
              obj = {
                stationId: ea.stationId,
                fuelType: ea.fuelType,
                capacity: ea.capacity,
                opening: ea.todayTank != 0 ? ea.todayTank : ea.balance,
                tankNo: ea.tankNo,
                createAt: body.createAt,
                nozzles: ea.nozzles,
                balance: ea.todayTank != 0 ? ea.todayTank : ea.balance,
              } as fuelBalanceDocument;
            } else {
              obj = {
                stationId: ea.stationId,
                fuelType: ea.fuelType,
                capacity: ea.capacity,
                opening: ea.todayTank != 0 ? ea.todayTank : ea.balance,
                tankNo: ea.tankNo,
                createAt: body.createAt,
                nozzles: ea.nozzles,
                balance: ea.todayTank != 0 ? ea.todayTank : ea.balance,
              } as fuelBalanceDocument;
            }

            await addFuelBalance(obj);
          })
      );

      return await getFuelBalance({
        stationId: body.stationId,
        createAt: body.createAt
      });
    } else {
      return 'Today fuel balance already calculated'
    }
  } catch (error) {
    return error;
  }
}
