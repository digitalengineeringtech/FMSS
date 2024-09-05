import { Request, Response, NextFunction } from "express";
import {
  addTankData,
  deleteTankData,
  tankDataPaginate,
  updateTankData,
} from "../service/tankData.service";
import fMsg from "../utils/helper";

export const getTankDataHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let pageNo = Number(req.params.page);
    let dateOfDay = req.query.dateOfDay;
    let { count, data } = await tankDataPaginate(pageNo, {
      dateOfDay,
    });

    fMsg(res, "Tank Data find", data, count);
  } catch (e) {
    next(new Error(e));
  }
};

export const addTankDataHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let result = await addTankData(req.body);
    fMsg(res, "New TankData data was added", result);
  } catch (e) {
    next(new Error(e));
  }
};

export const updateTankDataHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let result = await updateTankData(req.query, req.body);
    fMsg(res, "updated TankData data", result);
  } catch (e) {
    next(new Error(e));
  }
};

export const deleteTankDataHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await deleteTankData(req.query);
    fMsg(res, "TankData data was deleted");
  } catch (e) {
    next(new Error(e));
  }
};
