import {
    addCreditReturnHandler,
    getCreditReturnHandler,
    updateCreditReturnHandler,
} from "../controller/creditReturn.controller";


const creditReturnRoute = require("express").Router();

creditReturnRoute.get("/", getCreditReturnHandler);

creditReturnRoute.post("/", addCreditReturnHandler);

creditReturnRoute.put("/", updateCreditReturnHandler);

export default creditReturnRoute