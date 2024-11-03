import { Request, Response, NextFunction } from "express";
import { addCreditReturn, getCreditReturn, updateCreditReturn } from "../service/creditReturn.service";
import fMsg from "../utils/helper";


export const getCreditReturnHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let result = await getCreditReturn(req.query);
        fMsg(res, "credit return", result);
      } catch (e) {
        next(e);
      }
}

export const addCreditReturnHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let result = await addCreditReturn(req.body);
        fMsg(res, "add credit return", result);
      } catch (e) {
        next(e);
      }
}

export const updateCreditReturnHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let result = await updateCreditReturn(req.body);
        fMsg(res, "update credit return", result);
      } catch (e) {
        next(e);
      }
}