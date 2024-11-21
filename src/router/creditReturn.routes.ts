import {
    getCreditReturnHandler,
    updateCreditReturnHandler,
    updateSingleCreditReturnHandler,
} from "../controller/creditReturn.controller";


const creditReturnRoute = require("express").Router();

creditReturnRoute.get("/", getCreditReturnHandler);

creditReturnRoute.put("/", updateCreditReturnHandler);

creditReturnRoute.put("/:id", updateSingleCreditReturnHandler);

export default creditReturnRoute