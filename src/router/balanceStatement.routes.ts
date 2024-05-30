import {
  addAdjustBalanceHandler,
  addReciveBalanceHandler,
  addTodayBalanceHandler,
  addTotalBalanceHandler,
  getStatementBalanceHandler,
} from "../controller/balanceStatement.controller";
import { validateAll, validateToken } from "../middleware/validator";
import { fuelAdjustSchema, fuelReciveSchema, todayBalanceSchema } from "../schema/schema";

const balanceStatementRoute = require("express").Router();

balanceStatementRoute.get("/", validateToken, getStatementBalanceHandler);

balanceStatementRoute.post("/", validateToken, addTotalBalanceHandler);

balanceStatementRoute.post(
  "/recive-balance",
  validateToken,
  validateAll(fuelReciveSchema),
  addReciveBalanceHandler
);


balanceStatementRoute.post(
  "/adjust-balance",
  validateToken,
  validateAll(fuelAdjustSchema),
  addAdjustBalanceHandler
);


balanceStatementRoute.post(
  "/today-balance",
  validateToken,
  validateAll(todayBalanceSchema),
  addTodayBalanceHandler
);

export default balanceStatementRoute;
