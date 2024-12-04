import { createDiscountHandler, getDiscountHandler, updateDiscountHandler } from "../controller/discount.controller";

const discountRoute = require("express").Router();


discountRoute.get("/", getDiscountHandler);

discountRoute.post("/", createDiscountHandler);

discountRoute.put("/:id", updateDiscountHandler);


export default discountRoute;