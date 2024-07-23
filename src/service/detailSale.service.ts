import { response } from "express";
import { FilterQuery, UpdateQuery } from "mongoose";
import detailSaleModel, { detailSaleDocument } from "../model/detailSale.model";
import config from "config";
import { UserDocument } from "../model/user.model";
import moment from "moment-timezone";
import { get, mqttEmitter, previous, set } from "../utils/helper";
import axios from "axios";
import { addTankData } from "./tankData.service";

import { deviceLiveData } from "../connection/liveTimeData";

import { getUser } from "./user.service";
import {
  autoAddTotalBalance,
  updateTotalBalanceIssue,
} from "./balanceStatement.service";
import {
  addFuelBalance,
  calcFuelBalance,
  getFuelBalance,
  updateFuelBalance,
} from "./fuelBalance.service";
import { addDailyReport, getDailyReport } from "./dailyReport.service";
import { fuelBalanceDocument } from "../model/fuelBalance.model";
import fuelInModel from "../model/fuelIn.model";
import { escape } from "querystring";
import { string } from "zod";

interface Data {
  nozzleNo: string;
  fuelType: string;
  vocono: string;
  casherCode: string;
  asyncAlready: string;
  stationDetailId: string;
  cashType: string;
  couObjId: string;
  totalizer_liter: number | undefined;
  totalizer_amount: number | undefined;
  createAt: Date;
  user: UserDocument;
}

const limitNo = config.get<number>("page_limit");

export const getDetailSale = async (query: FilterQuery<detailSaleDocument>) => {
  try {
    return await detailSaleModel.find(query);
  } catch (e) {
    throw new Error(e);
  }
};

export const preSetDetailSale = async (
  depNo: string,
  nozzleNo: string,
  preset: string,
  type: string,
  body
) => {
  // console.log("====================================");
  // console.log(body);
  // console.log("====================================");

  const currentDate = moment().tz("Asia/Yangon").format("YYYY-MM-DD");
  const cuurentDateForVocono = moment().tz("Asia/Yangon").format("DDMMYYYY");

  const options = { timeZone: "Asia/Yangon", hour12: false };

  let currentDateTime = new Date().toLocaleTimeString("en-US", options);

  const [hour, minute, second] = currentDateTime.split(":").map(Number);

  if (hour == 24) {
    currentDateTime = `00:${minute}:${second}`;
  }

  let iso: Date = new Date(`${currentDate}T${currentDateTime}.000Z`);
  //hk
  // let rdsCount: number = await get(currentDate);
  // if (!rdsCount) {
  //   rdsCount = await detailSaleModel.countDocuments({
  //     dailyReportDate: currentDate,
  //   });
  //   if (rdsCount == 0) await autoAddTotalBalance(currentDate);
  // }

  // let newCount = rdsCount + 1;

  const count = await detailSaleModel.countDocuments({
    dailyReportDate: currentDate,
  });

  // console.log(count, count + 1, "............");

  await set(currentDate, count + 1);

  let stationNo = await get("stationNo");
  let stationId = await get("stationId");

  if (!stationId || !stationNo) {
    const user = await getUser({});
    stationNo = user[0].stationNo;
    stationId = user[0].stationId;
  }

  const lastDocument = await detailSaleModel
    .findOne({ nozzleNo: body.nozzleNo })
    .sort({ _id: -1, createAt: -1 });

  // body = {
  //   ...body,
  //   vocono: `${stationNo}/${body.user.name}/${cuurentDateForVocono}/${newCount}`,
  //   stationDetailId: stationId,
  //   casherCode: body.user.name,
  //   asyncAlready: "0",
  //   totalizer_liter: lastDocument?.totalizer_liter,
  //   totalizer_amount: lastDocument?.totalizer_amount,
  //   preset: `${preset} ${type}`,
  //   createAt: iso,
  // };
  body = {
    ...body,
    vocono: `${body.user.stationNo}/${body.user.name}/${cuurentDateForVocono}/${
      count + 1
    }`,
    stationDetailId: body.user.stationId,
    casherCode: body.user.name,
    asyncAlready: "0",
    totalizer_liter: lastDocument?.totalizer_liter,
    totalizer_amount: lastDocument?.totalizer_amount,
    preset: `${preset} ${type}`,
    createAt: iso,
  };

  let result = await new detailSaleModel(body).save();

  // let checkRpDate = await getDailyReport({
  //   stationId: result.stationDetailId,
  //   dateOfDay: result.dailyReportDate,
  // });

  // if (checkRpDate.length == 0) {
  //   await addDailyReport({
  //     stationId: result.stationDetailId,
  //     dateOfDay: result.dailyReportDate,
  //   });
  // }

  let checkDate = await getFuelBalance({
    stationId: result.stationDetailId,
    createAt: result.dailyReportDate,
  });

  let checkRpDate = await getDailyReport({
    stationId: result.stationDetailId,
    dateOfDay: result.dailyReportDate,
  });

  if (checkRpDate.length == 0) {
    await addDailyReport({
      stationId: result.stationDetailId,
      dateOfDay: result.dailyReportDate,
    });
  }

  if (checkDate.length == 0) {
    let prevDate = previous(new Date(result.dailyReportDate));

    let prevResult = await getFuelBalance({
      stationId: result.stationDetailId,
      createAt: prevDate,
    });

    await Promise.all(
      prevResult.map(async (ea) => {
        let obj: fuelBalanceDocument;
        if (ea.balance == 0) {
          obj = {
            stationId: ea.stationId,
            fuelType: ea.fuelType,
            capacity: ea.capacity,
            opening: ea.opening + ea.fuelIn,
            tankNo: ea.tankNo,
            createAt: result?.dailyReportDate,
            nozzles: ea.nozzles,
            balance: ea.opening + ea.fuelIn,
          } as fuelBalanceDocument;
        } else {
          obj = {
            stationId: ea.stationId,
            fuelType: ea.fuelType,
            capacity: ea.capacity,
            opening: ea.opening + ea.fuelIn - ea.cash,
            tankNo: ea.tankNo,
            createAt: result?.dailyReportDate,
            nozzles: ea.nozzles,
            balance: ea.opening + ea.fuelIn - ea.cash,
          } as fuelBalanceDocument;
        }

        await addFuelBalance(obj);
      })
    );
  }

  mqttEmitter(`detpos/local_server/preset`, nozzleNo + type + preset);
  return result;
};

export const addDetailSale = async (
  depNo: string,
  nozzleNo: string,
  body: Data
) => {
  try {
    //for time
    const currentDate = moment().tz("Asia/Yangon").format("YYYY-MM-DD");
    const cuurentDateForVocono = moment().tz("Asia/Yangon").format("DDMMYYYY");

    const options = { timeZone: "Asia/Yangon", hour12: false };

    let currentDateTime = new Date().toLocaleTimeString("en-US", options);

    const [hour, minute, second] = currentDateTime.split(":").map(Number);

    if (hour == 24) {
      currentDateTime = `00:${minute}:${second}`;
    }

    let iso: Date = new Date(`${currentDate}T${currentDateTime}.000Z`);
    //hk
    // console.log(iso, "this is iso date");
    // get today count
    // let rdsCount: number = await get(currentDate);
    // if (!rdsCount) {
    //   rdsCount = await detailSaleModel.countDocuments({
    //     dailyReportDate: currentDate,
    //   });
    //   if (rdsCount == 0) await autoAddTotalBalance(currentDate);
    // }

    // let newCount = rdsCount + 1;

    const count = await detailSaleModel.countDocuments({
      dailyReportDate: currentDate,
    });

    // console.log(count, "this is count");

    // await set(currentDate, newCount);

    let stationNo = await get("stationNo");
    let stationId = await get("stationId");

    if (!stationId || !stationNo) {
      const user = await getUser({});
      stationNo = user[0].stationNo;
      stationId = user[0].stationId;
    }

    const lastDocument = await detailSaleModel
      .findOne({ nozzleNo: body.nozzleNo })
      .sort({ _id: -1, createAt: -1 });
    //hk
    // body = {
    //   ...body,
    //   vocono: `${stationNo}/${body.user.name}/${cuurentDateForVocono}/${newCount}`,
    //   stationDetailId: stationId,
    //   casherCode: body.user.name,
    //   asyncAlready: "0",
    //   totalizer_liter: lastDocument?.totalizer_liter,
    //   totalizer_amount: lastDocument?.totalizer_amount,
    //   createAt: iso,
    // };
    body = {
      ...body,
      vocono: `${body.user.stationNo}/${
        body.user.name
      }/${cuurentDateForVocono}/${count + 1}`,
      stationDetailId: body.user.stationId,
      casherCode: body.user.name,
      asyncAlready: "0",
      totalizer_liter: lastDocument?.totalizer_liter,
      totalizer_amount: lastDocument?.totalizer_amount,
      createAt: iso,
    };

    let result = await new detailSaleModel(body).save();

    // let checkRpDate = await getDailyReport({
    //   stationId: result.stationDetailId,
    //   dateOfDay: result.dailyReportDate,
    // });

    // if (checkRpDate.length == 0) {
    //   await addDailyReport({
    //     stationId: result.stationDetailId,
    //     dateOfDay: result.dailyReportDate,
    //   });
    // }

    let checkDate = await getFuelBalance({
      stationId: result.stationDetailId,
      createAt: result.dailyReportDate,
    });

    let checkRpDate = await getDailyReport({
      stationId: result.stationDetailId,
      dateOfDay: result.dailyReportDate,
    });

    if (checkRpDate.length == 0) {
      await addDailyReport({
        stationId: result.stationDetailId,
        dateOfDay: result.dailyReportDate,
      });
    }
    if (checkDate.length == 0) {
      let prevDate = previous(new Date(result.dailyReportDate));

      let prevResult = await getFuelBalance({
        stationId: result.stationDetailId,
        createAt: prevDate,
      });

      await Promise.all(
        prevResult.map(async (ea) => {
          let obj: fuelBalanceDocument;
          if (ea.balance == 0) {
            obj = {
              stationId: ea.stationId,
              fuelType: ea.fuelType,
              capacity: ea.capacity,
              opening: ea.opening + ea.fuelIn,
              tankNo: ea.tankNo,
              createAt: result?.dailyReportDate,
              nozzles: ea.nozzles,
              balance: ea.opening + ea.fuelIn,
            } as fuelBalanceDocument;
          } else {
            obj = {
              stationId: ea.stationId,
              fuelType: ea.fuelType,
              capacity: ea.capacity,
              opening: ea.opening + ea.fuelIn - ea.cash,
              tankNo: ea.tankNo,
              createAt: result?.dailyReportDate,
              nozzles: ea.nozzles,
              balance: ea.opening + ea.fuelIn - ea.cash,
            } as fuelBalanceDocument;
          }

          await addFuelBalance(obj);
        })
      );
    }

    mqttEmitter(`detpos/local_server/${depNo}`, nozzleNo + "appro");

    return result;
  } catch (e) {
    throw new Error(e);
  }
};

export const updateDetailSale = async (
  query: FilterQuery<detailSaleDocument>,
  body: UpdateQuery<detailSaleDocument>
) => {
  let data = await detailSaleModel.findOne(query);
  if (!data) throw new Error("no data with that id");

  await detailSaleModel.updateMany(query, body);

  return await detailSaleModel.findById(data._id).lean();
};

export const detailSaleUpdateError = async (
  query: FilterQuery<detailSaleDocument>,
  body: UpdateQuery<detailSaleDocument>
) => {
  try {
    let data = await detailSaleModel.findOne(query);
    if (!data) throw new Error("no data with that id");

    const lastData: any = await detailSaleModel
      .find({ nozzleNo: data.nozzleNo })
      .sort({ _id: -1, createAt: -1 })
      .limit(2);

    body = {
      ...body,
      asyncAlready: "1",
      totalizer_liter: lastData[1].totalizer_liter + Number(body.saleLiter),
      totalizer_amount: lastData[1].totalizer_amount + Number(body.totalPrice),
      isError: "E",
    };

    let updateData = await detailSaleModel.findOneAndUpdate(query, body);

    let result = await detailSaleModel.findOne({ _id: updateData?._id });

    if (!result) {
      throw new Error("Final send in error");
    }

    mqttEmitter("detpos/local_server", `${result?.nozzleNo}/D1S1`);

    return result;
  } catch (e) {
    throw new Error(e);
  }
};

export const detailSaleUpdateByDevice = async (topic: string, message) => {
  try {
    const regex = /[A-Z]/g;
    let data: any[] = message.split(regex);
    let saleLiter = deviceLiveData.get(data[0])?.[0];
    let totalPrice = deviceLiveData.get(data[0])?.[1];

    console.log(data);

    let query = {
      nozzleNo: data[0],
    };

    const lastData: any[] = await detailSaleModel
      .find(query)
      .sort({ _id: -1, createAt: -1 })
      .limit(2)
      .lean();

    // console.log(lastData, "this is last data");
    if (!lastData[0] || !lastData[1]) {
      return;
    }

    let tankCount = await get("tankCount");

    console.log("tankCount", tankCount);

    let fuelBalances = await getFuelBalance({
      stationId: lastData[0].stationDetailId,
      // createAt: prevDate,
    });

    let tankNo;

    await Promise.all(
      fuelBalances
        .reverse()
        .slice(0, tankCount)
        .map(async (ea) => {
          console.log("nozzles", ea.nozzles);
          if (ea.nozzles.includes(data[0] as never)) {
            tankNo = ea.tankNo;
          } else {
            return;
          }
        })
    );

    console.log("tankNo", tankNo);

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
            volume: 444,
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
            volume: 555,
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
            volume: 666,
            connect: 3,
            id: 4,
          },
        ],
      },
    };

    let volume;

    try {
      let tankUrl = config.get<string>("tankDataUrl");
      let tankRealTimeData = tankUrl ? await axios.post(tankUrl) : fakedata;  
        volume = tankRealTimeData.data.data.find(
          (ea) => ea.id === tankNo
        )?.volume;
       console.log(volume);
    } catch (e) {
      console.log(e);
      volume = lastData[0].tankBalance
    }

    let updateBody: UpdateQuery<detailSaleDocument> = {
      nozzleNo: data[0],
      salePrice: data[1],
      saleLiter: saleLiter,
      totalPrice: totalPrice ? totalPrice : 0,
      asyncAlready: lastData[0].asyncAlready == "a0" ? "a" : "1",
      totalizer_liter:
        lastData[1].totalizer_liter + Number(saleLiter ? saleLiter : 0),
      totalizer_amount:
        lastData[1].totalizer_amount + Number(totalPrice ? totalPrice : 0),
      devTotalizar_liter: data[4],
      devTotalizar_amount: data[4] * data[1],
      tankNo: tankNo,
      tankBalance: volume,
      isError: "A",
    };

    await detailSaleModel.findByIdAndUpdate(lastData[0]._id, updateBody);

    let result = await detailSaleModel.findById(lastData[0]._id);

    if (!result) {
      throw new Error("Final send in error");
    }

    // console.log("..................");
    // console.log(result);
    // console.log("..................");
    // console.log(result.fuelType  , result.dailyReportDate)
    //hk
    // await updateTotalBalanceIssue(
    //   { fuelType: result.fuelType, dateOfDay: result.dailyReportDate },
    //   result.saleLiter
    // );

    console.log(lastData, "this is last data");

    let checkDate = await getFuelBalance({
      stationId: result.stationDetailId,
      createAt: result.dailyReportDate,
    });
    let checkRpDate = await getDailyReport({
      stationId: result.stationDetailId,
      dateOfDay: result.dailyReportDate,
    });

    // console.log(checkDate, "this is check data", checkDate.length);

    if (checkRpDate.length == 0) {
      await addDailyReport({
        stationId: result.stationDetailId,
        dateOfDay: result.dailyReportDate,
      });
    }

    if (checkDate.length == 0) {
      let prevDate = previous(new Date(result.dailyReportDate));

      let prevResult = await getFuelBalance({
        stationId: result.stationDetailId,
        // createAt: prevDate,
      });

      // console.log(tankCount, "this is tank count");
      // console.log(prevResult, "this is result");

      await Promise.all(
        prevResult
          .reverse()
          .slice(0, tankCount)
          .map(async (ea) => {
            let obj: fuelBalanceDocument;
            if (ea.balance == 0) {
              obj = {
                stationId: ea.stationId,
                fuelType: ea.fuelType,
                capacity: ea.capacity,
                opening: ea.opening + ea.fuelIn,
                tankNo: ea.tankNo,
                createAt: result?.dailyReportDate,
                nozzles: ea.nozzles,
                balance: ea.opening + ea.fuelIn,
              } as fuelBalanceDocument;
            } else {
              obj = {
                stationId: ea.stationId,
                fuelType: ea.fuelType,
                capacity: ea.capacity,
                opening: ea.opening + ea.fuelIn - ea.cash,
                tankNo: ea.tankNo,
                createAt: result?.dailyReportDate,
                nozzles: ea.nozzles,
                balance: ea.opening + ea.fuelIn - ea.cash,
              } as fuelBalanceDocument;
            }

            await addFuelBalance(obj);
          })
      );
    }

    mqttEmitter("detpos/local_server", `${result?.nozzleNo}/D1S1`);

    try {
      await addTankData({
        stationDetailId: lastData[0].stationDetailId,
        vocono: lastData[0].vocono,
        nozzleNo: lastData[0].nozzleNo,
      });
    } catch (e) {
      console.log(e);
    }

    await calcFuelBalance(
      {
        stationId: result.stationDetailId,
        fuelType: result.fuelType,
        createAt: result.dailyReportDate,
      },
      { liter: result.saleLiter },
      result.nozzleNo
    );

    let prevDate = previous(new Date(result.dailyReportDate));
    // console.log(prevDate, "this is prev date");

    let checkErrorData = await detailSaleModel.find({
      asyncAlready: 0,
      dailyReportDate: prevDate,
    });

    if (checkErrorData.length > 0) {
      // console.log(checkErrorData, "this is error");

      // cloud upload 0 condition
      for (const ea of checkErrorData) {
        try {
          let url = config.get<string>("detailsaleCloudUrl");
          let response = await axios.post(url, ea);
          console.log(response, "up to cloud");
          if (response.status == 200) {
            await detailSaleModel.findByIdAndUpdate(ea._id, {
              asyncAlready: "2",
            });
          } else {
            break;
          }
        } catch (error) {
          if (error.response && error.response.status === 409) {
          } else {
          }
        }
      }
    }

    //cloud upload 1 conditon
    let finalData = await detailSaleModel.find({ asyncAlready: 1 });
    for (const ea of finalData) {
      try {
        let url = config.get<string>("detailsaleCloudUrl");
        let response = await axios.post(url, ea);
        console.log(response, "up to cloud");
        if (response.status == 200) {
          await detailSaleModel.findByIdAndUpdate(ea._id, {
            asyncAlready: "2",
          });
        } else {
          break;
        }
      } catch (error) {
        console.log(error);
        if (error.response && error.response.status === 409) {
        } else {
        }
      }
    }

    let checkErrorFuelInData = await fuelInModel.find({
      asyncAlready: 1,
      // dailyReportDate: prevDate,
    });

    const url = config.get<string>("fuelInCloud");

    if (checkErrorFuelInData.length > 0) {
      for (const ea of checkErrorFuelInData) {
        try {
          let no = await fuelInModel.count();
          let tankCondition = await getFuelBalance({
            stationId: ea.stationDetailId,
            fuelType: ea.fuel_type,
            tankNo: Number(ea.tankNo),
            createAt: ea.receive_date,
          });

          console.log(tankCondition, "this is tank condition", ea);

          const updatedBody = {
            driver: ea.driver,
            bowser: ea.bowser,
            tankNo: ea.tankNo,
            fuel_type: ea.fuel_type,
            receive_balance: ea.receive_balance.toString(),
            receive_date: ea.receive_date,
            asyncAlready: ea.asyncAlready,
            stationId: ea.stationDetailId,
            stationDetailId: ea.stationDetailId,
            fuel_in_code: no + 1,
            tank_balance: tankCondition[0]?.balance || 0,
          };

          console.log(updatedBody, "this is updatebody");

          const url = config.get<string>("fuelInCloud");

          try {
            let response = await axios.post(url, updatedBody);

            if (response.status == 200) {
              await fuelInModel.findByIdAndUpdate(ea._id, {
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

        // try {
        //   let response = await axios.post(url, ea);

        //   if (response.status == 200) {
        //     await fuelInModel.findByIdAndUpdate(result._id, {
        //       asyncAlready: "2",
        //     });
        //   } else {
        //     console.log("error is here fuel in");
        //   }
        // } catch (error) {
        //   console.log("errr", error.response.data.msg);
        //   if (error.response && error.response.status === 409) {
        //   } else {
        //   }
        // }
      }
    }
  } catch (e) {
    throw new Error(e);
  }
};

export const deleteDetailSale = async (
  query: FilterQuery<detailSaleDocument>
) => {
  try {
    let DetailSale = await detailSaleModel.find(query);
    if (!DetailSale) {
      throw new Error("No DetailSale with that id");
    }
    return await detailSaleModel.deleteMany(query);
  } catch (e) {
    throw new Error(e);
  }
};

export const getDetailSaleByFuelType = async (
  dateOfDay: string,
  // stationId : string,
  fuelType: string
) => {
  let fuel = await getDetailSale({
    dailyReportDate: dateOfDay,
    fuelType: fuelType,
  });

  let fuelLiter = fuel
    .map((ea) => ea["saleLiter"])
    .reduce((pv: number, cv: number): number => pv + cv, 0);
  let fuelAmount = fuel
    .map((ea) => ea["totalPrice"])
    .reduce((pv: number, cv: number): number => pv + cv, 0);

  return { count: fuel.length, liter: fuelLiter, price: fuelAmount };
};

export const detailSalePaginate = async (
  pageNo: number,
  query: FilterQuery<detailSaleDocument>
): Promise<{ count: number; data: detailSaleDocument[] }> => {
  const reqPage = pageNo == 1 ? 0 : pageNo - 1;
  const skipCount = limitNo * reqPage;
  const data = await detailSaleModel
    .find(query)
    .sort({ createAt: -1 })
    .skip(skipCount)
    .limit(limitNo)
    .select("-__v");
  const count = await detailSaleModel.countDocuments(query);

  return { data, count };
};

export const detailSaleByDate = async (
  query: FilterQuery<detailSaleDocument>,
  d1: Date,
  d2: Date
): Promise<detailSaleDocument[]> => {
  const filter: FilterQuery<detailSaleDocument> = {
    ...query,
    createAt: {
      $gt: d1,
      $lt: d2,
    },
  };

  let result = await detailSaleModel
    .find(filter)
    .sort({ createAt: -1 })
    .select("-__v");

  return result;
};

export const detailSaleByDateAndPagi = async (
  query: FilterQuery<detailSaleDocument>,
  d1: Date,
  d2: Date,
  pageNo: number
): Promise<{ count: number; data: detailSaleDocument[] }> => {
  try {
    const reqPage = pageNo == 1 ? 0 : pageNo - 1;
    const skipCount = limitNo * reqPage;
    const filter: FilterQuery<detailSaleDocument> = {
      ...query,
      createAt: {
        $gt: d1,
        $lt: d2,
      },
    };

    const dataQuery = detailSaleModel
      .find(filter)
      .sort({ createAt: -1 })
      .skip(skipCount)
      .limit(limitNo)
      // .populate("stationDetailId")
      .select("-__v");

    const countQuery = detailSaleModel.countDocuments(filter);

    const [data, count] = await Promise.all([dataQuery, countQuery]);

    return { data, count };
  } catch (error) {
    throw error;
  }
};

export const initialDetail = async (body) => {
  try {
    body.vocono = Date.now();
    return await new detailSaleModel(body).save();
  } catch (e) {
    throw e;
  }
};

export const addDetailSaleByAp = async (depNo: string, nozzleNo: string) => {
  try {
    const currentDate = moment().tz("Asia/Yangon").format("YYYY-MM-DD");
    const cuurentDateForVocono = moment().tz("Asia/Yangon").format("DDMMYYYY");

    const options = { timeZone: "Asia/Yangon", hour12: false };

    let currentDateTime = new Date().toLocaleTimeString("en-US", options);

    const [hour, minute, second] = currentDateTime.split(":").map(Number);

    if (hour == 24) {
      currentDateTime = `00:${minute}:${second}`;
    }

    let iso: Date = new Date(`${currentDate}T${currentDateTime}.000Z`);

    // get today count
    // const count = await detailSaleModel.countDocuments({
    //   dailyReportDate: currentDate,
    // });

    let rdsCount: number = await get(currentDate);
    if (!rdsCount) {
      rdsCount = await detailSaleModel.countDocuments({
        dailyReportDate: currentDate,
      });
    }

    let newCount = rdsCount + 1;

    await set(currentDate, newCount);

    let stationNo = await get("stationNo");
    let stationId = await get("stationId");

    if (!stationId || !stationNo) {
      const user = await getUser({});
      stationNo = user[0].stationNo;
      stationId = user[0].stationId;
    }

    const lastDocument = await detailSaleModel
      .findOne({ nozzleNo: nozzleNo })
      .sort({ _id: -1, createAt: -1 });

    let body = {
      // ...body,
      nozzleNo,
      vehicleType: " ",
      carNo: " ",
      cashType: "paided",
      fuelType: lastDocument?.fuelType,
      couObjId: null,
      device: "auto_permit",
      vocono: `${stationNo}/Ca/${cuurentDateForVocono}/${newCount}`,
      stationDetailId: stationId,
      casherCode: "Ca",
      asyncAlready: "a0",
      totalizer_liter: lastDocument?.totalizer_liter,
      totalizer_amount: lastDocument?.totalizer_amount,
      isError: "AU",
      createAt: iso,
    };

    let result = await new detailSaleModel(body).save();
    mqttEmitter(`detpos/local_server/${depNo}`, nozzleNo + "appro");

    return result;
  } catch (e) {
    // console.log("e in service");
    throw new Error(e);
  }
};

export const updateDetailSaleByAp = async (
  id: detailSaleDocument["_id"],
  body: UpdateQuery<detailSaleDocument>
) => {
  let data = await detailSaleModel.findById(id);
  if (!data) throw new Error("no data with that id");

  let updateBody = {
    ...body,
    asyncAlready: "1",
  };

  await detailSaleModel.findByIdAndUpdate(id, updateBody);

  let result = await detailSaleModel.findById(id);

  if (!result) throw new Error("error in update");

  let prevDate = previous(new Date(result.dailyReportDate));

  let checkErrorData = await detailSaleModel.find({
    asyncAlready: 0,
    dailyReportDate: prevDate,
  });
  // cloud upload 0 condition
  if (checkErrorData.length > 0) {
    for (const ea of checkErrorData) {
      try {
        let url = config.get<string>("detailsaleCloudUrl");
        let response = await axios.post(url, ea);
        if (response.status == 200) {
          await detailSaleModel.findByIdAndUpdate(ea._id, {
            asyncAlready: "2",
          });
        } else {
          break;
        }
      } catch (error) {
        if (error.response && error.response.status === 409) {
        } else {
        }
      }
    }
  }

  //cloud upload 1 conditon

  let finalData = await detailSaleModel.find({ asyncAlready: 1 });
  for (const ea of finalData) {
    try {
      let url = config.get<string>("detailsaleCloudUrl");
      let response = await axios.post(url, ea);
      if (response.status == 200) {
        await detailSaleModel.findByIdAndUpdate(ea._id, {
          asyncAlready: "2",
        });
      } else {
        break;
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
      } else {
      }
    }
  }
};

export const getLastDetailSaleData = async (
  nozzleNo: string
): Promise<detailSaleDocument | null> => {
  return await detailSaleModel
    .findOne({ nozzleNo })
    .sort({ _id: -1, createAt: -1 });
};

export const detailSaleStatement = async (reqDate: string) => {
  const fuelTypes = [
    "001-Octane Ron(92)",
    "002-Octane Ron(95)",
    "004-Diesel",
    "005-Premium Diesel",
  ];

  const fuelTypeTotalArray = await Promise.all(
    fuelTypes.map(async (fuelType) => {
      return await detailSaleModel
        .aggregate([
          {
            $match: {
              fuelType: fuelType,
              dailyReportDate: reqDate,
            },
          },
          {
            $group: {
              _id: null,
              fuelType: { $first: "$fuelType" },
              saleLiter: { $sum: "$saleLiter" },
              totalPrice: { $sum: "$totalPrice" },
            },
          },
        ])
        .exec();
    })
  );

  return fuelTypeTotalArray.flat();
};
