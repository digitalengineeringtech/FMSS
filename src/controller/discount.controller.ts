import { Request, Response, NextFunction } from "express";
import fMsg from "../utils/helper";
import { createDiscount, getDiscount } from "../service/discount.service";

export const getDiscountHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const discount = await getDiscount(req.query);
    fMsg(res, "discount", discount);
  } catch (e) {
    next(new Error(e));
  }
};

export const createDiscountHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const discount = await createDiscount(req.body);
    fMsg(res, "discount", discount);
  } catch (e) {
    next(new Error(e));
  }
};