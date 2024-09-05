import { Request, Response, NextFunction } from "express";
import { addCustomer, getCustomer } from "../service/customer.service";
import fMsg from "../utils/helper";

export const getCustomerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let result = await getCustomer(req.query);
    fMsg(res, "customer", result);
  } catch (e) {
    next(e);
  }
};

export const addCustomerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let result = await addCustomer(req.body);
    fMsg(res, "customer", result);
  } catch (e) {
    next(e);
  }
};
