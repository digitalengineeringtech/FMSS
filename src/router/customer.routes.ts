import {
  addCustomerHandler,
  getCustomerHandler,
} from "../controller/customer.controller";

const customerRoute = require("express").Router();

customerRoute.get("/", getCustomerHandler);

customerRoute.post("/", addCustomerHandler);

export default customerRoute;
