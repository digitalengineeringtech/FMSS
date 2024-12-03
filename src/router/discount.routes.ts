import { createDiscountHandler, getDiscountHandler } from "../controller/discount.controller";

const discountRoute = require("express").Router();


discountRoute.get("/", getDiscountHandler);

discountRoute.post("/", createDiscountHandler);


export default discountRoute;