import { FilterQuery, UpdateQuery } from "mongoose";
import fuelBalanceModel, {
  fuelBalanceDocument,
} from "../model/fuelBalance.model";
import config from "config";
import moment from "moment-timezone";

export const getFuelBalance = async (
  query: FilterQuery<fuelBalanceDocument>,
  tankCount?: number
) => {
  try {
    // return await fuelBalanceModel.find(query).lean().select("-__v");
    return await fuelBalanceModel
      .find(query)
      .sort({ $natural: -1 })
      .limit(Number(tankCount))
      .lean({ virtuals: true})
      .select("-__v");
  } catch (e) {
    throw new Error(e);
  }
};

export const getFuelBalanceCount = async () => {
  try {
    return await fuelBalanceModel.countDocuments();
  } catch (e) {
    throw new Error(e);
  }
};

export const addFuelBalance = async (body: fuelBalanceDocument) => {
  try {
    return await new fuelBalanceModel(body).save();
  } catch (e) {
    throw new Error(e);
  }
};

export const updateTodayTankBalance = async (body: fuelBalanceDocument) => {
  console.log({
    tankNo: body.tankNo,
    createAt: moment().format("YYYY-MM-DD"),
  });
  try {
    const query = {
      tankNo: body.tankNo,
      createAt: moment().format("YYYY-MM-DD"),
    };

    const result = await fuelBalanceModel.findOneAndUpdate(query, body, {
      new: true,
    });
    console.log(result);
    return result;
  } catch (e) {
    throw new Error(e);
  }
};

export const updateFuelBalance = async (
  query: FilterQuery<fuelBalanceDocument>,
  body: UpdateQuery<fuelBalanceDocument>
) => {
  try {
    await fuelBalanceModel.updateMany(query, body);
    return await fuelBalanceModel.find(query).lean();
  } catch (e) {
    throw new Error(e);
  }
};

export const deleteFuelBalance = async (
  query: FilterQuery<fuelBalanceDocument>
) => {
  try {
    let fuelBalance = await fuelBalanceModel.find(query);
    if (!fuelBalance) {
      throw new Error("No fuelBalance with that id");
    }

    return await fuelBalanceModel.deleteMany(query);
  } catch (e) {
    throw new Error(e);
  }
};

// export const calcFuelBalance = async (query, body, payload: number) => {
//   try {
//     let result = await fuelBalanceModel.find(query);
//     if (result.length == 0) {
//       throw new Error("not work");
//     }
//     let gg = result.find(
//       (ea: { nozzles: string[] }) =>
//         ea["nozzles"].includes(payload.toString()) == true
//     );
//     if (!gg) {
//       throw new Error("no tank with that nozzle");
//     }
//     let cashLiter = gg?.cash + body.liter;

//     let obj = {
//       cash: cashLiter,
//       balance: gg.opening + gg.fuelIn - cashLiter,
//     };

//     await fuelBalanceModel.updateMany({ _id: gg?._id }, obj);
//     console.log("caculated");
//     return await fuelBalanceModel.find({ _id: gg?._id }).lean();
//   } catch (e) {
//     throw new Error(e);
//   }
// };

export const calcFuelBalance = async (query, body, payload: string) => {
  try {
    let result = await fuelBalanceModel.find(query).lean({ virtuals: true});
    if (result.length === 0) {
      throw new Error("No fuel balance data found for the given query.");
    }

    let gg = result.find((ea: { nozzles: string[] }) =>
      ea.nozzles.includes(payload.toString())
    );

    if (!gg) {
      throw new Error("No tank with the provided nozzle found.");
    }

    if (typeof body.liter !== "number" || isNaN(body.liter)) {
      throw new Error("Invalid 'liter' value. It must be a valid number.");
    }

    let cashLiter = gg.cash + body.liter;

    let obj = {
      cash: cashLiter,
      balance: gg.opening + gg.fuelIn - cashLiter,
    };

    await fuelBalanceModel.updateMany({ _id: gg?._id }, obj);
    return await fuelBalanceModel.find({ _id: gg?._id }).lean({ virtuals: true });
  } catch (e) {
    return e; // Rethrow the error with the actual error message
  }
};

export const fuelBalancePaginate = async (
  pageNo: number,
  query: FilterQuery<fuelBalanceDocument>
): Promise<{ count: number; data: fuelBalanceDocument[] }> => {
  const limitNo = config.get<number>("page_limit");
  const reqPage = pageNo == 1 ? 0 : pageNo - 1;
  const skipCount = limitNo * reqPage;

  const data = await fuelBalanceModel
    .find(query)
    .sort({ realTime: -1 })
    .skip(skipCount)
    .limit(limitNo)
    .lean({ virtuals: true})
    // .populate("stationId")
    .select("-__v");

  const count = await fuelBalanceModel.countDocuments(query);

  return { data, count };
};

export const fuelBalanceByDate = async (
  query: FilterQuery<fuelBalanceDocument>,
  d1: Date,
  d2: Date
): Promise<fuelBalanceDocument[]> => {
  const filter: FilterQuery<fuelBalanceDocument> = {
    ...query,
    realTime: {
      $gt: d1,
      $lt: d2,
    },
  };

  console.log("====================================");
  console.log(filter);
  console.log("====================================");

  let result = await fuelBalanceModel
    .find(filter)
    .sort({ realTime: -1 })
    .populate("stationId")
    .lean({ virtuals: true})
    .select("-__v");

  return result;
};

export const fuelBalanceByOneDate = async (
  query: FilterQuery<fuelBalanceDocument>,
  d1: Date
): Promise<fuelBalanceDocument[]> => {
  const filter: FilterQuery<fuelBalanceDocument> = {
    ...query,
    createAt: d1.toLocaleDateString("fr-CA"),
  };

  console.log("====sfdsf================================");
  console.log(d1.toLocaleDateString("fr-CA"), query);
  console.log("=====sff===============================");

  let result = await fuelBalanceModel
    .find(filter)
    .sort({ realTime: -1 })
    .lean({ virtuals: true})
    .select("-__v");

  return result;
};
