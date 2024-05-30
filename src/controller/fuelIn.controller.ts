import { NextFunction, Request, Response } from "express";
import { deleteFuelIn, fuelInPaginate } from "../service/fuelIn.service";
import fMsg from "../utils/helper";

export const getFuelInHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let pageNo = Number(req.params.page);
    let { data, count } = await fuelInPaginate(pageNo, req.query);
    fMsg(res, "FuelIn are here", data, count);
  } catch (e) {
    next(new Error(e));
  }
};


export const deleteFuelInHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await deleteFuelIn(req.query);
      fMsg(res, "FuelIn data was deleted");
    } catch (e) {
      next(new Error(e));
    }
  };