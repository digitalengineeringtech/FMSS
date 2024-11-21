import { Request, Response, NextFunction } from "express";
import { getCreditReturn, updateCreditReturn, updateSingleCreditReturn } from '../service/creditReturn.service';
import fMsg from "../utils/helper";


export const getCreditReturnHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let result = await getCreditReturn(req.query);
        fMsg(res, "credit return", result);
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

export const updateSingleCreditReturnHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {    
        let result = await updateSingleCreditReturn(req.params.id, req.body);
        fMsg(res, "update single credit return", result);
      } catch (e) {
        next(e);
      }
}