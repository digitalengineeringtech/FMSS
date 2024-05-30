import { Request, Response, NextFunction } from "express";
import { detailSaleStatement } from "../service/detailSale.service";
import {
  addTotalStatement,
  getTotalStatement,
  updateTotalStatement,
} from "../service/totalStatement.service";
import { totalStatementDocument } from "../model/totalStatement.model";
import fMsg from "../utils/helper";

export const getTotalStatementHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reqDate = req.query.reqDate as string;

    if (!reqDate) throw new Error("You need date");

    let checkStatement = await getTotalStatement({ dateOfDay: reqDate });

    if (!checkStatement[0]) {
      let statementData = await detailSaleStatement(reqDate);

      if (!statementData[0]) return fMsg(res, "No statement");
      let body = {
        dateOfDay: reqDate,
        reportByFuelType: statementData,
        isDone:
          reqDate == new Date().toLocaleDateString(`fr-CA`) ? false : true,
      } as totalStatementDocument;
      let result = await addTotalStatement(body);
      fMsg(res, "statement data", result);
    } else if (checkStatement[0].isDone == false) {
      let statementData = await detailSaleStatement(reqDate);
      if (!statementData[0]) return fMsg(res, "No statement");

      let body = {
        reportByFuelType: statementData,
        isDone:
          reqDate == new Date().toLocaleDateString(`fr-CA`) ? false : true,
      };

      let result = await updateTotalStatement(checkStatement[0]._id, body);
      fMsg(res, "statement data", result);
    }

    fMsg(res, "statement data", checkStatement);
  } catch (e) {
    next(e);
  }
};
