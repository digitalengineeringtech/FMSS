import {
    addCreditCustomerHandler,
    getCreditCustomerHandler,
  } from "../controller/customerCredit.controller";
  
  const customerCreditRoute = require("express").Router();
  
  customerCreditRoute.get("/", getCreditCustomerHandler);
  
  customerCreditRoute.post("/", addCreditCustomerHandler);
  
  export default customerCreditRoute;