import { createDiscountHandler, deleteDiscountHandler, getDiscountHandler, updateDiscountHandler } from "../controller/discount.controller";

const discountRoute = require("express").Router();


discountRoute.get("/", getDiscountHandler);

discountRoute.post("/", createDiscountHandler);

discountRoute.put("/:id", updateDiscountHandler);

discountRoute.delete('/:id', deleteDiscountHandler);


export default discountRoute;