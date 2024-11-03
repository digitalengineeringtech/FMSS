import {
    getCreditReturnHandler,
    updateCreditReturnHandler,
} from "../controller/creditReturn.controller";


const creditReturnRoute = require("express").Router();

creditReturnRoute.get("/", getCreditReturnHandler);

creditReturnRoute.put("/", updateCreditReturnHandler);

export default creditReturnRoute