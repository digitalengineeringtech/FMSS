import { Request, Response, NextFunction } from "express";
import fMsg from "../utils/helper";
import { addMpta, getMpta } from "../service/mpta.service";

export const getMptaHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const mpta = await getMpta(req.query);
    fMsg(res, "mpta are here ", mpta);
  } catch (e) {
    next(new Error(e));
  }
};

export const addMptaHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const mpta = await addMpta(req.body);
    fMsg(res, mpta.result?.error ?? 'Car number by card create successfully...', mpta);
  } catch (e) {
    next(new Error(e));
  }
};