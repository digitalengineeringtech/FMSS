import { Request, Response, NextFunction, query } from "express";
import fMsg, { previous } from "../utils/helper";
import moment, { MomentTimezone } from "moment-timezone";
import {
  getFuelBalance,
  addFuelBalance,
  updateFuelBalance,
  deleteFuelBalance,
  fuelBalancePaginate,
  fuelBalanceByDate,
  fuelBalanceByOneDate,
  updateTodayTankBalance,
} from "../service/fuelBalance.service";
import { fuelBalanceDocument } from "../model/fuelBalance.model";

const currentDate = moment().tz("Asia/Yangon").format("YYYY-MM-DD");

export const getAllFuelBalanceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let result = await getFuelBalance(req.query);
    fMsg(res, "FuelIn are here", result);
  } catch (e) {
    next(new Error(e));
  }
};

export const getFuelBalanceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let pageNo = Number(req.params.page);
    let sDate = req.query.sDate?.toString();

    delete req.query.sDate;
    delete req.query.eDate;

    let query = req.query;

    if (!sDate) {
      throw new Error("you need date");
    }

    let { count, data } = await fuelBalancePaginate(pageNo, {
      ...query,
      createAt: sDate,
    });

    fMsg(res, "fuelBalance find", data, count);
  } catch (e) {
    next(new Error(e));
  }
};

export const addFuelBalanceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // req.body = {
    //   ...req.body,
    //   stationId: req.body.user[0].stationId,
    // };
    // console.log("wk");

    let result = await addFuelBalance(req.body);
    fMsg(res, "New fuelBalance data was added", result);
  } catch (e) {
    next(new Error(e));
  }
};

export const updateTodayTankHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let result = await updateTodayTankBalance(req.body);
    fMsg(res, "Today tank updated", result);
  } catch (e) {
    next(new Error(e));
  }
};

export const updateFuelBalanceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let result = await updateFuelBalance(req.query, req.body);
    fMsg(res, "updated fuelBalance data", result);
  } catch (e) {
    next(new Error(e));
  }
};

export const deleteFuelBalanceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await deleteFuelBalance(req.query);
    fMsg(res, "fuelBalance data was deleted");
  } catch (e) {
    next(new Error(e));
  }
};

export const getFuelBalanceByDateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let sDate: any = req.query.sDate;
    let eDate: any = req.query.eDate;

    delete req.query.sDate;
    delete req.query.eDate;

    let query = req.query;

    if (!sDate) {
      throw new Error("you need date");
    }
    if (!eDate) {
      eDate = new Date();
    }
    const startDate: Date = new Date(sDate);
    const endDate: Date = new Date(eDate);
    console.log(".......ee");
    let result = await fuelBalanceByDate(query, startDate, endDate);
    console.log(query, startDate, endDate);
    fMsg(res, "fuel balance between two date", result);
  } catch (e) {
    next(new Error(e));
  }
};
export const getFuelBalanceByOneDateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let sDate: any = req.query.sDate;

    delete req.query.sDate;

    let query = req.query;

    if (!sDate) {
      throw new Error("you need date");
    }
    const format = (date) => {
      const dateObj = new Date(date);

      const day = String(dateObj.getUTCDate()).padStart(2, "0");
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0"); // Months are 0-based
      const year = dateObj.getUTCFullYear();

      // const time = dateObj?.toISOString().slice(11, 19);

      return `${year}-${month}-${day}`;
    };

    console.log(sDate, "1");
    let startDate: Date = new Date(sDate);
    // startDate.setDate(startDate.getDate() - 1);
    console.log(startDate, "2");
    let result = await fuelBalanceByOneDate(query, startDate);
    fMsg(res, "fuel balance between two date", result);
  } catch (e) {
    next(new Error(e));
  }
};
