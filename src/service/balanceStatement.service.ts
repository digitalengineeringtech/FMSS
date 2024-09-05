import { FilterQuery } from "mongoose";
import { UpdateQuery } from "mongoose";
import balanceStatementModel, {
  balanceStatementDocument,
} from "../model/balanceStatement.model";
import fMsg, { previous } from "../utils/helper";
import { response } from "express";

export const getTotalBalance = async (
  query: FilterQuery<balanceStatementDocument>
) => {
  return await balanceStatementModel.find(query).lean();
};

export const addTotalBalance = async (body: balanceStatementDocument) => {
  const date = new Date().toLocaleDateString("fr-CA");
  // console.log(date, "this is date");
  return await new balanceStatementModel(body).save();
};

export const deleteTotalBalance = async (
  query: FilterQuery<balanceStatementDocument>
) => {
  return await balanceStatementModel.deleteMany(query);
};

export const autoAddTotalBalance = async (todayDate: string) => {
  let todayData = await balanceStatementModel.find({ dateOfDay: todayDate });
  if (todayData.length > 0) return {};

  let prevDate = previous();
  // let prevData = await balanceStatementModel.find({ dateOfDay: prevDate });
  let prevData = (await balanceStatementModel.find()).reverse().slice(0, 4);
  if (prevData.length < 1) return {};

  prevData.map(async (ea) => {
    let newData = {
      fuelType: ea.fuelType,
      openingBalance: ea.balance,
      yesterdayTank: ea.todayTank,
      balance: ea.balance,
      dateOfDay: todayDate,
    };
    await new balanceStatementModel(newData).save();
  });
};

// for updating in detail sale
export const updateTotalBalanceIssue = async (
  query: FilterQuery<balanceStatementDocument>,
  issue: number
) => {
  let result = await balanceStatementModel.find(query);
  // console.log(result);
  if (result.length < 1) throw new Error("Not work");
  let data = result[0].toObject();
  let balance = data.openingBalance - (data.issue + issue);
  let updateData = {
    ...data,
    issue: data.issue + issue,
    balance: balance,
    todayGL: data.issue + issue - data.tankIssue,
    totalGL: data.todayTank - balance,
  };
  await balanceStatementModel.updateMany(query, updateData);
  return await balanceStatementModel.find(query);
};

export const updateTotalBalanceReceive = async (
  id: string,
  receiveAmount: number
) => {
  let data = await balanceStatementModel.findById(id);
  if (!data) throw new Error("Not Work");

  let balance = data.balance + receiveAmount;
  // console.log(typeof receiveAmount);
  let updateData = {
    ...data.toObject(),
    receive: receiveAmount,
    balance: balance,
    totalGL: data.todayTank - balance,
  };

  // console.log(updateData);

  await balanceStatementModel.findByIdAndUpdate(id, updateData);
  return await balanceStatementModel.findById(id);
};

export const updateTotalBalanceAdjust = async (
  id: string,
  adjustAmount: number
) => {
  let data = await balanceStatementModel.findById(id);
  if (!data) throw new Error("Not Work");
  let balance = data.openingBalance + data.receive + adjustAmount - data.issue;

  let updateData = {
    ...data.toObject(),
    adjust: adjustAmount,
    balance: balance,
    totalGL: data.todayTank - balance,
  };
  // console.log(updateData);

  await balanceStatementModel.findByIdAndUpdate(id, updateData);
  return await balanceStatementModel.findById(id);
};

export const updateTotalBalanceToday = async (
  id: string,
  todayTankAmount: number
) => {
  let data = await balanceStatementModel.findById(id);
  if (!data) throw new Error("Not work");

  let tankIssue = data.yesterdayTank - todayTankAmount;

  let updateData = {
    ...data.toObject(),
    todayTank: todayTankAmount,
    tankIssue: tankIssue,
    todayGL: tankIssue - data.issue,
    totalGL: todayTankAmount - data.balance,
  };
  // console.log(updateData);
  await balanceStatementModel.findByIdAndUpdate(id, updateData);
  return await balanceStatementModel.findById(id);
};

//update by hk

export const manualAddTotalBalanceToday = async (todayDate: string, req) => {
  let todayData = await balanceStatementModel.find({ dateOfDay: todayDate });
  // console.log(todayData);
  if (todayData.length > 0) {
    return fMsg(response, "Balance statement is already exit");
  } else {
    let prevDate = previous();
    let prevData = await balanceStatementModel.find({ dateOfDay: prevDate });
    let lastData = (await balanceStatementModel.find()).reverse().slice(0, 4);
    if (prevData.length > 0) {
      prevData.map(async (ea) => {
        let newData = {
          fuelType: ea.fuelType,
          openingBalance: ea.balance,
          yesterdayTank: ea.todayTank,
          balance: ea.balance,
          dateOfDay: todayDate,
        };
        await new balanceStatementModel(newData).save();
      });
    } else {
      if (lastData.length > 0) {
        lastData.map(async (ea) => {
          let newData = {
            fuelType: ea.fuelType,
            openingBalance: ea.balance,
            yesterdayTank: ea.todayTank,
            balance: ea.balance,
            dateOfDay: todayDate,
          };
          await new balanceStatementModel(newData).save();
        });
      } else {
        // console.log(req);
        const initialData = [
          {
            fuelType: "001-Octane Ron(92)",
            dateOfDay: todayDate,
            openingBalance: req.body.OctaneTwo,
            receive: 0,
            issue: 0,
            adjust: 0,
            balance: 0,
            todayTank: 0,
            yesterdayTank: 0,
            tankIssue: 0,
            todayGL: 0,
            totalGL: 0,
          },
          {
            fuelType: "005-Premium Diesel",
            dateOfDay: todayDate,
            openingBalance: req.body.PreDiesel,
            receive: 0,
            issue: 0,
            adjust: 0,
            balance: 0,
            todayTank: 0,
            yesterdayTank: 0,
            tankIssue: 0,
            todayGL: 0,
            totalGL: 0,
          },
          {
            fuelType: "004-Diesel",
            dateOfDay: todayDate,
            openingBalance: req.body.Diesel,
            receive: 0,
            issue: 0,
            adjust: 0,
            balance: 0,
            todayTank: 0,
            yesterdayTank: 0,
            tankIssue: 0,
            todayGL: 0,
            totalGL: 0,
          },
          {
            fuelType: "002-Octane Ron(95)",
            dateOfDay: todayDate,
            openingBalance: req.body.OctaneFive,
            receive: 0,
            issue: 0,
            adjust: 0,
            balance: 0,
            todayTank: 0,
            yesterdayTank: 0,
            tankIssue: 0,
            todayGL: 0,
            totalGL: 0,
          },
        ];
        initialData.map(async (ea) => {
          let newData = ea;
          // console.log(ea);
          await new balanceStatementModel(newData).save();
        });
      }
    }
  }
};
