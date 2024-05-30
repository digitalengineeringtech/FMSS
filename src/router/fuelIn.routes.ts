import {
  deleteFuelInHandler,
  getFuelInHandler,
} from "../controller/fuelIn.controller";
import { hasAnyPermit } from "../middleware/permitValidator";
import { roleValidator } from "../middleware/roleValidator";
import { validateAll, validateToken } from "../middleware/validator";
import { allSchemaId } from "../schema/schema";

const fuelInRoute = require("express").Router();

fuelInRoute.get(
  "/pagi/:page",
  validateToken,
  hasAnyPermit(["view"]),
  getFuelInHandler
);

fuelInRoute.delete(
  "/",
  validateToken,
  roleValidator(["admin"]),
  hasAnyPermit(["delete"]),
  validateAll(allSchemaId),
  deleteFuelInHandler
);

export default fuelInRoute;
