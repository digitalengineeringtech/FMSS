import { Request, Response, NextFunction } from "express";
import { addCreditCustomer, getCreditCustomer } from "../service/customerCredit.service";
import fMsg from "../utils/helper";


export const getCreditCustomerHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let result = await getCreditCustomer(req.query);
      fMsg(res, "customer credit", result);
    } catch (e) {
      next(e);
    }
  };
  
  export const addCreditCustomerHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let result = await addCreditCustomer(req.body);
      fMsg(res, "customer credit", result);
    } catch (e) {
      next(e);
    }
  };