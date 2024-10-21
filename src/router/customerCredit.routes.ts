import {
    addCreditCustomerHandler,
    getCreditCustomerHandler,
  } from "../controller/customerCredit.controller";
  
  const creditCustomerRoute = require("express").Router();
  
  creditCustomerRoute.get("/", getCreditCustomerHandler);
  
  creditCustomerRoute.post("/", addCreditCustomerHandler);
  
  export default creditCustomerRoute;