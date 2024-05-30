import { getTotalStatementHandler } from "../controller/totalStatement.controller";
import { validateToken } from "../middleware/validator";

const totalStatementRoute = require("express").Router();

totalStatementRoute.get("/",validateToken, getTotalStatementHandler);
export default totalStatementRoute;
