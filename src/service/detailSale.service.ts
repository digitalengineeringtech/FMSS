import { response } from "express";
import { FilterQuery, UpdateQuery } from "mongoose";
import detailSaleModel, { detailSaleDocument } from "../model/detailSale.model";
import config from "config";
import { UserDocument } from "../model/user.model";
import moment from "moment-timezone";
import { get, mqttEmitter, presetFormat, previous, set } from "../utils/helper";
import axios from "axios";
import {
  addTankData,
  getTankData,
  updateExistingTankData,
} from "./tankData.service";

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
import { log } from "console";
import { create } from "domain";
import logger from "../utils/logger";
import deviceModel from "../model/device.model";
import customerModel from "../model/customer.model";
import { getCustomerByCardId } from "./customer.service";
import { checkCreditLimit } from "./customerCredit.service";
import customerCreditModel from '../model/customerCredit.model';
import creditReturnModel from '../model/creditReturn.model';

interface Data {
  cusCardId: string;
  depNo: string;
  nozzleNo: string;
  fuelType: string;
  vocono: string;
  casherCode: string;
  asyncAlready: string;
  stationDetailId: string;
  customer: string | undefined;
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

  let customerId;
  
  if(body.cashType == 'Credit') {
    const customer = await getCustomerByCardId(body.cusCardId);

    if(customer) {
      const checkLimit = await checkCreditLimit(customer._id);
  
      if(checkLimit == false) {
        throw new Error('Credit Limit Exceeded');
      } 

      customerId = customer._id;
    }
  }

  const currentDate = moment().tz("Asia/Yangon").format("YYYY-MM-DD");
  const cuurentDateForVocono = moment().tz("Asia/Yangon").format("DDMMYYYY");

  const options = { timeZone: "Asia/Yangon", hour12: false };

  let currentDateTime = new Date().toLocaleTimeString("en-US", options);

  const [hour, minute, second] = currentDateTime.split(":").map(Number);

  if (hour == 24) {
    currentDateTime = `00:${minute}:${second}`;
  }

  let iso: Date = new Date(`${currentDate}T${currentDateTime}.000Z`);
 
  const count = await detailSaleModel.countDocuments({
    dailyReportDate: currentDate,
  });

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

  body = {
    ...body,
    vocono: `${body.user.stationNo}/${body.user.name}/${cuurentDateForVocono}/${
      count + 1
    }`,
    customer: customerId,
    stationDetailId: body.user.stationId,
    casherCode: body.user.name,
    asyncAlready: "0",
    totalizer_liter: lastDocument?.totalizer_liter,
    totalizer_amount: lastDocument?.totalizer_amount,
    preset: `${preset} ${type}`,
    createAt: iso,
  };

  let result = await new detailSaleModel(body).save();

  // if (lastDocument?.devTotalizar_liter === 0) {
  //   mqttEmitter(`detpos/local_server/reload/${depNo}`, nozzleNo);
  //   return;
  // }

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
    let customerId;
  
    if(body.cashType == 'Credit') {
      const customer = await getCustomerByCardId(body.cusCardId);
  
      if(customer) {
        const checkLimit = await checkCreditLimit(customer._id);
    
        if(checkLimit == false) {
          throw new Error('Credit Limit Exceeded');
        } 
  
        customerId = customer._id;
      }
    }
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

    body = {
      ...body,
      vocono: `${body.user.stationNo}/${
        body.user.name
      }/${cuurentDateForVocono}/${count + 1}`,
      stationDetailId: body.user.stationId,
      customer: customerId,
      casherCode: body.user.name,
      asyncAlready: "0",
      depNo: depNo,
      totalizer_liter: lastDocument?.totalizer_liter,
      totalizer_amount: lastDocument?.totalizer_amount,
      createAt: iso,
    };

    let result = await new detailSaleModel(body).save();

    // if (lastDocument?.devTotalizar_liter === 0) {
    //   mqttEmitter(`detpos/local_server/reload/${depNo}`, nozzleNo);
    //   return;
    // }

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

    let tankCount = await get("tankCount");

    let tankUrl = config.get<string>("tankDataUrl");

    if (tankUrl == "") {
      let checkDate = await getFuelBalance({
        stationId: result.stationDetailId,
        createAt: result.dailyReportDate,
      });

      if (checkDate.length == 0) {
        let prevResult = await getFuelBalance(
          {
            stationId: result.stationDetailId,
          },
          tankCount
        );

        await Promise.all(
          prevResult.map(async (ea) => {
            let obj: fuelBalanceDocument;
            if (ea.balance == 0) {
              obj = {
                stationId: ea.stationId,
                fuelType: ea.fuelType,
                capacity: ea.capacity,
                opening: ea.todayTank != 0 ? ea.todayTank : ea.balance,
                tankNo: ea.tankNo,
                createAt: result?.dailyReportDate,
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
                createAt: result?.dailyReportDate,
                nozzles: ea.nozzles,
                balance: ea.todayTank != 0 ? ea.todayTank : ea.balance,
              } as fuelBalanceDocument;
            }

            await addFuelBalance(obj);
          })
        );
      }
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

export const detailSaleUpdateByDevice = async (
  topic: string,
  message,
  lane
) => {
  try {
    const regex = /[A-Z]/g;
    let data: any[] = message.split(regex);
    let saleLiter = deviceLiveData.get(data[0])?.[0] || 0;
    let totalPrice = deviceLiveData.get(data[0])?.[1];

    // if (data[1] == "" && data[2] == "" && data[3] == "") {
    //   await zeroDetailSaleUpdateByDevice(topic, message, lane);
    //   return;
    // }

    let query = {
      nozzleNo: data[0],
      // asyncAlready: { $ne: "2" }
    };

    const lastData: any[] = await detailSaleModel
      .find(query)
      .sort({ _id: -1, createAt: -1 })
      .limit(2)
      .lean();

    // console.log(lastData, "this is last data", data[0]);
    if (!lastData[0] || !lastData[1] || lastData[0].asyncAlready == '1' || lastData[0].asyncAlready == '2') {
      return;
    }

    let tankCount = await get("tankCount");

    // console.log("tankCount", lastData);

    let fuelBalances = await getFuelBalance(
      {
        stationId: lastData[0].stationDetailId,
        // createAt: prevDate,
      },
      tankCount
    );

    // console.log(fuelBalances, "this is fb");

    let tankNo;

    // await Promise.all(
    fuelBalances.map(async (ea) => {
      // console.log("nozzles", ea.nozzles);
      if (ea.nozzles.includes(data[0] as never)) {
        tankNo = ea.tankNo;
      }
    });
    // );

    // console.log(tankNo, "tank number");

    let volume: number;

    let tankUrl = config.get<string>("tankDataUrl");

    if (tankUrl != "") {
      try {
        let tankRealTimeData;
        tankRealTimeData = await axios.post(tankUrl);

        if (tankRealTimeData.status !== 200) {
          throw new Error(
            `Unexpected response status: ${tankRealTimeData.status}`
          );
        }

        volume =
          tankRealTimeData.data.data.find((ea) => ea.id === tankNo)?.volume ||
          0;

        if (volume === undefined) {
          volume = Number(lastData[1]?.tankBalance) + Number(data[2]) || 0;
        }
      } catch (e: any) {
        console.log(`Failed to fetch tank data: ${e.message}`);
        volume = Number(lastData[1]?.tankBalance) + Number(data[2]) || 0;
      }
    } else {
      volume =
        Number(fuelBalances?.find((e) => e.tankNo == tankNo)?.balance) +
          Number(data[2]) || 0;
    }

    // console.log(
    //   fuelBalances?.find((e) => e.tankNo == tankNo),
    //   "sale volume"
    // );

    //end update

    let updateBody: UpdateQuery<detailSaleDocument> = {
      nozzleNo: data[0],
      salePrice: data[1],
      saleLiter: data[2],
      depNo: topic,
      // saleLiter: data[2],
      // totalPrice: totalPrice ? totalPrice : 0,
      totalPrice: data[3],
      asyncAlready: lastData[0].asyncAlready == "a0" ? "a" : "1",
      totalizer_liter:
        lastData[1].totalizer_liter + Number(data[2] ? data[2] : 0),
      totalizer_amount:
        lastData[1].totalizer_amount + Number(data[3] ? data[3] : 0),
      devTotalizar_liter: data[4],
      devTotalizar_amount: data[1] == "" ? data[4] * 1 : data[4] * data[1],
      tankNo: tankNo,
      tankBalance: volume || 0,
      isError: "A",
    };

    await detailSaleModel.findByIdAndUpdate(lastData[0]._id, updateBody);

    let result = await detailSaleModel.findById(lastData[0]._id);

    if(result && result.cashType == 'Credit') {
        const customerCredit = await customerCreditModel.findOne({ customer: result.customer });
        if(customerCredit) {
            customerCredit.limitAmount = Number(customerCredit.limitAmount) - Number(result.totalPrice);
            await customerCredit.save();

            await creditReturnModel.create({
                cutomerCredit: customerCredit._id,
                vocono: result.vocono,
                creditAmount: result.totalPrice,
                creditDueDate: customerCredit.creditDueDate
            }); 
        }
    }

    if (!result) {
      throw new Error("Final send in error");
    }

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

    // console.log(tankUrl, "this is tank url");

    if (tankUrl == "") {
      // console.log("00000000");
      let checkDate = await getFuelBalance({
        stationId: result.stationDetailId,
        createAt: result.dailyReportDate,
      });

      if (checkDate.length == 0) {
        let prevResult = await getFuelBalance(
          {
            stationId: result.stationDetailId,
          },
          tankCount
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
                  createAt: result?.dailyReportDate,
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
                  createAt: result?.dailyReportDate,
                  nozzles: ea.nozzles,
                  balance: ea.todayTank != 0 ? ea.todayTank : ea.balance,
                } as fuelBalanceDocument;
              }

              await addFuelBalance(obj);
            })
        );
      }
      // console.log("1111111");

      await calcFuelBalance(
        {
          stationId: result.stationDetailId,
          fuelType: result.fuelType,
          createAt: result.dailyReportDate,
        },
        { liter: result.saleLiter },
        result.nozzleNo
      );
      // console.log("22222222222222222");
    }

    mqttEmitter("detpos/local_server", `${result?.nozzleNo}/D1S1`);

    // get tank data by today date
    if (tankUrl != "") {
      const tankData = await getTankData({
        stationDetailId: result.stationDetailId,
        dateOfDay:  moment().tz("Asia/Yangon").format("YYYY-MM-DD"),
      });

      // check if tank data exists
      try {
        if (tankData.length == 0) {
          
          await addTankData({
            stationDetailId: result.stationDetailId,
            vocono: lastData[0].vocono,
            nozzleNo: lastData[0].nozzleNo,
            dateOfDate: moment(lastData[0].dailyReportDate).tz("Asia/Yangon").format("YYYY-MM-DD"),
          });
        } else {
          await updateExistingTankData({
            id: tankData[0]._id,
            vocono: lastData[0].vocono,
            nozzleNo: lastData[0].nozzleNo,
            stationDetailId: result.stationDetailId,
            dateOfDay: moment(lastData[0].dailyReportDate).tz("Asia/Yangon").format("YYYY-MM-DD"),
          });
        }
      } catch (error) {
        console.error("Error handling tank data:", error);
      }
    }

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

          logger.info(`
            ========== start ==========
            function: Response Logger
            Response: ${JSON.stringify(response.data)}
            ========== ended ==========
            `, { file: 'detailsale.log' });

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
        logger.info(`
          ========== start ==========
          function: Response Logger
          Response: ${JSON.stringify(response.data)}
          ========== ended ==========
        `, { file: 'detailsale.log' });
        if (response.status == 200) {
          await detailSaleModel.findByIdAndUpdate(ea._id, {
            asyncAlready: "2",
          });
        } else {
          break;
        }
      } catch (error) {
        // console.log(error);
        if (error.response && error.response.status === 409) {
        } else {
        }
      }
    }

    let checkErrorFuelInData = await fuelInModel.find({
      asyncAlready: 1,
      // dailyReportDate: prevDate,
    });

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

          // console.log(updatedBody, "this is updatebody");

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
            // console.log("errr", error);
            if (error.response && error.response.status === 409) {
            } else {
            }
          }

          return result;
        } catch (e) {
          throw new Error(e);
        }
      }
    }
  } catch (e) {
    throw new Error(e);
  }
};

export const zeroDetailSaleUpdateByDevice = async (
  topic: string,
  message,
  lane
) => {
  try {
    const regex = /[A-Z]/g;
    let data: any[] = message.split(regex);
    let saleLiter = deviceLiveData.get(data[0])?.[0];
    let totalPrice = deviceLiveData.get(data[0])?.[1];
    let depNo = topic;
    
    if (data[1] == "" && data[2] == "" && data[3] == "") {
      let query = {
        nozzleNo: data[0],
        // devTotalizar_liter: { $ne: 0 },
      };
      const lastData: any[] = await detailSaleModel
        .find(query)
        .limit(2)
        .sort({ _id: -1, createdAt: -1 })
        .lean();

      const noZeroLastData: any = await detailSaleModel
        .findOne({
          nozzleNo: data[0],
          devTotalizar_liter: { $ne: 0 },
        })
        .sort({ _id: -1, createdAt: -1 })
        .lean();

      const prevDev_TzrLiter = noZeroLastData?.devTotalizar_liter;
      const prevSalePrice = noZeroLastData?.salePrice;

      if (!lastData[0] || !lastData[1]) {
        return;
      }

      let tankCount = await get("tankCount");

      let fuelBalances = await getFuelBalance(
        {
          // stationId: lastData[0].stationDetailId,
          // createAt: prevDate,
        },
        tankCount
      );
      // console.log(fuelBalances);

      let tankNo;

      // await Promise.all(
      //   fuelBalances
      //     .reverse()
      //     .slice(0, tankCount)
      //     .map(async (ea) => {
      //       if (ea.nozzles.includes(data[0] as never)) {
      //         tankNo = ea.tankNo;
      //       } else {
      //         return;
      //       }
      //     })
      // );

      fuelBalances.map(async (ea) => {
        // console.log("nozzles", ea.nozzles);
        if (ea.nozzles.includes(data[0] as never)) {
          tankNo = ea.tankNo;
        }
      });

      let volume: number;

      let tankUrl = config.get<string>("tankDataUrl");

      if (tankUrl != "") {
        try {
          let tankRealTimeData;
          tankRealTimeData = await axios.post(tankUrl);

          if (tankRealTimeData.status !== 200) {
            throw new Error(
              `Unexpected response status: ${tankRealTimeData.status}`
            );
          }

          volume = tankRealTimeData.data.data.find(
            (ea) => ea.id === tankNo
          )?.volume;

          if (volume === undefined) {
            volume = Number(lastData[1]?.tankBalance) + Number(data[2] || 0);
          }
        } catch (e: any) {
          volume = Number(lastData[1]?.tankBalance) + Number(data[2] || 0);
        }
      } else {
        volume =
          Number(fuelBalances?.find((e) => e.tankNo == tankNo)?.balance) +
          Number(data[2] || 0);
      }
      //end update
      let updateBody: UpdateQuery<detailSaleDocument> = {
        depNo: depNo,
        nozzleNo: data[0],
        salePrice: prevSalePrice,
        saleLiter: (Number(data[4]) - Number(prevDev_TzrLiter)).toFixed(3),
        totalPrice: Math.floor(
          prevSalePrice * (Number(data[4]) - Number(prevDev_TzrLiter))
        ),
        asyncAlready: lastData[0].asyncAlready == "a0" ? "a" : "1",
        totalizer_liter:
          lastData[1].totalizer_liter ??
          +Number(prevSalePrice ? prevSalePrice : 0),
        totalizer_amount:
          lastData[1].totalizer_amount ??
          +Number(
            Number(data[4]) - Number(prevDev_TzrLiter)
              ? Number(data[4]) - Number(prevDev_TzrLiter)
              : 0
          ),
        devTotalizar_liter: data[4],
        devTotalizar_amount: data[4] * prevSalePrice,
        tankNo: tankNo,
        tankBalance: volume || 0,
        isReload: 1,
        isError: "A",
      };

      await detailSaleModel.findByIdAndUpdate(lastData[1]._id, updateBody);

      let result = await detailSaleModel.findById(lastData[1]._id);

      if (!result) {
        throw new Error("Final send in error");
      }

      if (result?.preset != null) {
        const { preset, type } = presetFormat(result?.preset);
        mqttEmitter(
          `detpos/local_server/preset`,
          result?.nozzleNo + type + preset
        );
      } else {
        mqttEmitter(`detpos/local_server/${depNo}`, result?.nozzleNo + "appro");
      }

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

      if (tankUrl == "") {
        let checkDate = await getFuelBalance({
          stationId: result.stationDetailId,
          createAt: result.dailyReportDate,
        });

        if (checkDate.length == 0) {
          let prevResult = await getFuelBalance(
            {
              stationId: result.stationDetailId,
            },
            tankCount
          );

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

        await calcFuelBalance(
          {
            stationId: result.stationDetailId,
            fuelType: result.fuelType,
            createAt: result.dailyReportDate,
          },
          { liter: result.saleLiter },
          result.nozzleNo
        );
      }

      // get tank data by today date

      if (tankUrl != "") {
        const tankData = await getTankData({
          stationDetailId: result.stationDetailId,
          dateOfDay: moment().format("YYYY-MM-DD"),
        });

        // check if tank data exists
        try {
          if (tankData.length === 0) {
            await addTankData({
              stationDetailId: result.stationDetailId,
              vocono: lastData[0].vocono,
              nozzleNo: lastData[0].nozzleNo,
            });
          } else {
            await updateExistingTankData({
              id: tankData[0]._id,
              stationDetailId: result.stationDetailId,
            });
          }
        } catch (error) {
          console.error("Error handling tank data:", error.message);
        }
      }
    } else {
      let query = {
        nozzleNo: data[0],
        devTotalizar_liter: 0,
      };
      const lastData: any[] = await detailSaleModel
        .find(query)
        .limit(2)
        .sort({ _id: -1, createdAt: -1 })
        .lean();
      // console.log(lastData);
      if (!lastData[0] || !lastData[1]) {
        return;
      }
      let tankCount = await get("tankCount");
      let fuelBalances = await getFuelBalance(
        {
          stationId: lastData[0].stationDetailId,
          // createAt: prevDate,
        },
        tankCount
      );
      let tankNo;
      // await Promise.all(
      //   fuelBalances
      //     .reverse()
      //     .slice(0, tankCount)
      //     .map(async (ea) => {
      //       if (ea.nozzles.includes(data[0] as never)) {
      //         tankNo = ea.tankNo;
      //       } else {
      //         return;
      //       }
      //     })
      // );
      fuelBalances.map(async (ea) => {
        // console.log("nozzles", ea.nozzles);
        if (ea.nozzles.includes(data[0] as never)) {
          tankNo = ea.tankNo;
        }
      });
      let volume: number;
      let tankUrl = config.get<string>("tankDataUrl");
      if (tankUrl != "") {
        try {
          let tankRealTimeData;
          tankRealTimeData = await axios.post(tankUrl);
          if (tankRealTimeData.status !== 200) {
            throw new Error(
              `Unexpected response status: ${tankRealTimeData.status}`
            );
          }
          volume =
            tankRealTimeData.data.data.find((ea) => ea.id === tankNo)?.volume ||
            0;
          if (volume === undefined) {
            volume = Number(lastData[1]?.tankBalance) + Number(data[2] || 0);
          }
        } catch (e: any) {
          console.log(`Failed to fetch tank data: ${e.message}`);
          volume = Number(lastData[1]?.tankBalance) + Number(data[2] || 0);
        }
      } else {
        volume =
          Number(fuelBalances?.find((e) => e.tankNo == tankNo)?.balance) +
          Number(data[2] || 0);
      }
      //end update
      let updateBody: UpdateQuery<detailSaleDocument> = {
        depNo: depNo,
        nozzleNo: data[0],
        salePrice: data[1],
        saleLiter: data[2],
        totalPrice: data[3],
        asyncAlready: lastData[0].asyncAlready == "a0" ? "a" : "1",
        totalizer_liter:
          lastData[1].totalizer_liter ?? +Number(data[2] ? data[2] : 0),
        totalizer_amount:
          lastData[1].totalizer_amount ?? +Number(data[3] ? data[3] : 0),
        devTotalizar_liter: data[4],
        devTotalizar_amount: data[4] * data[1],
        tankNo: tankNo,
        tankBalance: volume || 0,
        isReload: 1,
        isError: "A",
      };
      await detailSaleModel.findByIdAndUpdate(lastData[1]._id, updateBody);

      let result = await detailSaleModel.findById(lastData[1]._id);

      if (!result) {
        throw new Error("Final send in error");
      }

      if (lastData[0]?.preset != null) {
        const { preset, type } = presetFormat(lastData[0]?.preset);
        mqttEmitter(
          `detpos/local_server/preset`,
          result?.nozzleNo + type + preset
        );
      } else {
        mqttEmitter(`detpos/local_server/${depNo}`, result?.nozzleNo + "appro");
      }

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
      if (tankUrl == "") {
        let checkDate = await getFuelBalance({
          stationId: result.stationDetailId,
          createAt: result.dailyReportDate,
        });
        if (checkDate.length == 0) {
          let prevResult = await getFuelBalance(
            {
              stationId: result.stationDetailId,
            },
            tankCount
          );
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
        await calcFuelBalance(
          {
            stationId: result.stationDetailId,
            fuelType: result.fuelType,
            createAt: result.dailyReportDate,
          },
          { liter: result.saleLiter },
          result.nozzleNo
        );
      }
      // get tank data by today date
      if (tankUrl != "") {
        const tankData = await getTankData({
          stationDetailId: result.stationDetailId,
          dateOfDay: moment().format("YYYY-MM-DD"),
        });
        // check if tank data exists
        try {
          if (tankData.length === 0) {
            await addTankData({
              stationDetailId: result.stationDetailId,
              vocono: lastData[0].vocono,
              nozzleNo: lastData[0].nozzleNo,
            });
          } else {
            await updateExistingTankData({
              id: tankData[0]._id,
              stationDetailId: result.stationDetailId,
            });
          }
        } catch (error) {
          console.error("Error handling tank data:", error.message);
        }
      }
    }
  } catch (error) {
    console.log(error.message);
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

export const detailSaleSummary = async (
  query: FilterQuery<detailSaleDocument>,
  d1: Date,
  d2: Date
): Promise<any> => {
  const filter: FilterQuery<detailSaleDocument> = {
    ...query,
    createAt: {
      $gt: d1,
      $lt: d2,
    },
    asyncAlready: { $ne: 0 },
    devTotalizar_liter: { $ne: 0 },
  };

  let beforeDetailSales = await detailSaleModel
    .find({
      ...query,
      createAt: {
        $lt: d1,
      },
      asyncAlready: { $ne: 0 },
      devTotalizar_liter: { $ne: 0 },
    })
    .sort({ createAt: -1 })
    .select("-__v");

  let detailsales = await detailSaleModel
    .find(filter)
    .sort({ createAt: -1 })
    .select("-__v");

  let nozzleNos = detailsales.map((sale) => sale.nozzleNo);

  let nozzles = [...new Set(nozzleNos)];

  let result = nozzles.map((nozzle) => {
    const salesForNozzle = detailsales.filter(
      (sale) => sale.nozzleNo == nozzle
    );
    const beforeStartDate = beforeDetailSales?.filter(
      (sale) => sale.nozzleNo === nozzle
    );

    if (salesForNozzle.length > 0) {
      let openingTotalizerLiter = beforeStartDate[0]?.devTotalizar_liter;
      let closingTotallizerLiter = salesForNozzle[0]?.devTotalizar_liter;
      let devTotalizerDif = closingTotallizerLiter - openingTotalizerLiter;
      let totalPrice = salesForNozzle.reduce(
        (sum, sale) => sum + sale.totalPrice,
        0
      );

      return {
        nozzleNo: nozzle,
        // data: salesForNozzle,
        fuel_type: salesForNozzle[0].fuelType,
        devTotalizerDif: devTotalizerDif,
        totalPrice,
      };
    }
  });

  return result;
};

export const detailSaleSummaryDetail = async (
  query: FilterQuery<detailSaleDocument>,
  d1: Date,
  d2: Date
): Promise<any> => {
  const filter: FilterQuery<detailSaleDocument> = {
    ...query,
    createAt: {
      $gt: d1,
      $lt: d2,
    },
  };

  let devices = await deviceModel
    .find()
    .select(["nozzle_no", "fuel_type"])
    .exec();

  let beforeDetailSales = await detailSaleModel
    .find({
      ...query,
      createAt: {
        $lt: d1,
      },
      asyncAlready: { $ne: 0 },
      devTotalizar_liter: { $ne: 0 },
    })
    .sort({ createAt: -1 })
    .select("-__v");

  let detailsales = await detailSaleModel
    .find(filter)
    .sort({ createAt: -1 })
    .select("-__v");

  let result = devices.map((device) => {
    let salesForNozzle = detailsales
      ?.filter((sale) => sale.nozzleNo === device.nozzle_no)
      ?.filter((ea) => ea.asyncAlready != "0")
      ?.filter((e) => e.devTotalizar_liter != 0);

    let beforeStartDate = beforeDetailSales?.filter(
      (sale) => sale.nozzleNo === device.nozzle_no
    );

    if (salesForNozzle.length > 0) {
      let pricePerLiter = salesForNozzle[0].salePrice;
      let openingTotalizerLiter = beforeStartDate[0].devTotalizar_liter;
      let closingTotalizerLiter = salesForNozzle[0].devTotalizar_liter;
      let differentLiter = closingTotalizerLiter - openingTotalizerLiter;
      let saleLiter = salesForNozzle.reduce(
        (sum, sale) => sum + sale.saleLiter,
        0
      );
      let saleDifferentLiter = differentLiter - saleLiter;
      let totalPrice = salesForNozzle.reduce(
        (sum, sale) => sum + sale.totalPrice,
        0
      );
      let priceDifferent = differentLiter * pricePerLiter - totalPrice;

      let calculated = {
        nozzleNo: device.nozzle_no,
        fuelType: device.fuel_type,
        pricePerLiter,
        openingTotalizerLiter,
        closingTotalizerLiter,
        differentLiter,
        saleLiter,
        saleDifferentLiter,
        totalPrice,
        priceDifferent,
      };

      return calculated;
    } else {
      return {
        nozzleNo: device.nozzle_no,
        fuelType: device.fuel_type,
        pricePerLiter: 0,
        openingTotalizerLiter: 0,
        closingTotalizerLiter: 0,
        differentLiter: 0,
        saleLiter: 0,
        saleDifferentLiter: 0,
        totalPrice: 0,
        priceDifferent: 0,
      };
    }
  });

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

export const creditDetailSalePaginate = async (
  pageNo: number,
  query: FilterQuery<detailSaleDocument>
) => {
  try {
    const reqPage = pageNo == 1 ? 0 : pageNo - 1;
    const skipCount = limitNo * reqPage;

    const filter = {
      ...query,
      cashType: 'Credit'
    };

    const data = await detailSaleModel.find(filter)
                .populate({
                  path: "customer",
                  match: { cusCardId: query.cusCardId },
                })
                .skip(skipCount)
                .limit(limitNo)
                .select("-__v");

    const count = await detailSaleModel.countDocuments(filter);

    return { data, count };
  } catch (error) {
    throw error;
  }
}

export const creditDetailSaleByDateAndPagi = async (
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
      cashType: 'Credit'
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

export const detailSaleWithoutPagiByDate = async (
  query: FilterQuery<detailSaleDocument>,
  d1: Date,
  d2: Date
): Promise<{ count: number; data: detailSaleDocument[]; sumTotalPrice: number; sumTotalLiter: number }> => {
  try {
    const filter: FilterQuery<detailSaleDocument> = {
      ...query,
      createAt: {
        $gt: d1,
        $lt: d2,
      },
    };

    // Fetch all data without pagination
    const dataQuery = detailSaleModel
      .find(filter)
      .sort({ createAt: -1 })
      .select("-__v");

    const countQuery = detailSaleModel.countDocuments(filter);

    const [data, count] = await Promise.all([dataQuery, countQuery]);

    const sumResults = await detailSaleModel.find(filter).select("saleLiter totalPrice").exec();
    
    const sumTotalPrice = sumResults.reduce((acc: any, item: { totalPrice: any }) => acc + item.totalPrice, 0);
    const sumTotalLiter = sumResults.reduce((acc: any, item: { saleLiter: any }) => acc + item.saleLiter, 0);

    return { data, count, sumTotalPrice, sumTotalLiter };
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
