import { Request, Response, NextFunction } from "express";
import fMsg from "../utils/helper";
import { createDiscount, deleteDiscount, getDiscount, updateDiscount } from "../service/discount.service";

export const getDiscountHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const discount = await getDiscount(req.query);
    fMsg(res, "discounts are here ", discount);
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
    fMsg(res, "discount created", discount);
  } catch (e) {
    next(new Error(e));
  }
};

export const updateDiscountHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    const discount = await updateDiscount(id, req.body);
    fMsg(res, "discount updated", discount);
  } catch (e) {
    next(new Error(e));
  }
};

export const deleteDiscountHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const discount = await deleteDiscount(id);
    fMsg(res, "discount deleted", discount);
  } catch (e) {
    next(new Error(e));
  }
};