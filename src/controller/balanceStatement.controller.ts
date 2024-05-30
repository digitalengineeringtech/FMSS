import { Request, Response, NextFunction } from "express";
import fMsg from "../utils/helper";
import {
  addTotalBalance,
  getTotalBalance,
  updateTotalBalanceAdjust,
  updateTotalBalanceReceive,
  updateTotalBalanceToday,
} from "../service/balanceStatement.service";
import { addFuelIn } from "../service/fuelIn.service";

export const addTotalBalanceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let result = await addTotalBalance(req.body);
    fMsg(res, "balance statement added", result);
  } catch (e) {
    next(e);
  }
};

export const getStatementBalanceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let reqDate = req.query.reqDate as string;
    if (!reqDate) throw new Error("req date is require");
    let result = await getTotalBalance({ dateOfDay: reqDate });
    fMsg(res, "Balance Statement", result);
  } catch (e) {
    next(e);
  }
};

export const addReciveBalanceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.query.id as string;
    const receiveAmount = Number(req.body.receiveAmount);

    if (!id || !receiveAmount) throw new Error("Bad request");
    
    await updateTotalBalanceReceive(id, receiveAmount);
    await addFuelIn(req.body);

    fMsg(res, "receive data was added");
  } catch (e) {
    next(e);
  }
};

export const addAdjustBalanceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.query.id as string;
    const adjustAmount = Number(req.body.adjustAmount);
    if (!id || !adjustAmount) throw new Error("Bad request");
    await updateTotalBalanceAdjust(id, adjustAmount);
    fMsg(res, "adjust data was added");
  } catch (e) {
    next(e);
  }
};

export const addTodayBalanceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.query.id as string;
    const todayTankAmount = Number(req.body.todayTankAmount);
    if (!id || !todayTankAmount) throw new Error("Bad request");
    await updateTotalBalanceToday(id, todayTankAmount);
    fMsg(res, "today tank  data was added");
  } catch (e) {
    next(e);
  }
};
