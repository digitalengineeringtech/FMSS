import {
  addAtgFuelInHandler,
  addFuelInHandler,
  calculateFuelBalanceHandler,
  deleteFuelInHandler,
  getFuelInByDateHandler,
  getFuelInHandler,
  updateAtgFuelInHandler,
  updateFuelInHandler,
} from "../controller/fuelIn.controller";
import { hasAnyPermit } from "../middleware/permitValidator";
import { roleValidator } from "../middleware/roleValidator";
import { validateAll, validateToken } from "../middleware/validator";
import { allSchemaId, fuelInSchema } from "../schema/schema";
const fuelInRoute = require("express").Router();

fuelInRoute.get(
  "/pagi/:page",
  validateToken,
  hasAnyPermit(["view"]),
  getFuelInHandler
);

fuelInRoute.get(
  "/pagi/by-date/:page",
  validateToken,
  hasAnyPermit(["view"]),
  getFuelInByDateHandler
);

fuelInRoute.post(
  "/",
  validateToken,
  roleValidator(["admin", "manager"]), //In that one role is manager
  hasAnyPermit(["add"]),
  validateAll(fuelInSchema),
  addFuelInHandler
);
fuelInRoute.patch(
  "/",
  validateToken,
  roleValidator(["admin"]),
  hasAnyPermit(["edit"]),
  validateAll(allSchemaId),
  updateFuelInHandler
);
fuelInRoute.delete(
  "/",
  validateToken,
  roleValidator(["admin"]),
  hasAnyPermit(["delete"]),
  validateAll(allSchemaId),
  deleteFuelInHandler
);

fuelInRoute.post(
  "/atg",
  validateToken,
  roleValidator(["admin", "manager"]), //In that one role is manager
  hasAnyPermit(["add"]),
  validateAll(fuelInSchema),
  addAtgFuelInHandler
);

fuelInRoute.post(
  "/atg/update",
  validateToken,
  roleValidator(["manager"]),
  hasAnyPermit(["edit"]),
  updateAtgFuelInHandler
);

fuelInRoute.post(
  "/check/fuel-balance", 
  validateToken,
  roleValidator(["manager"]),
  calculateFuelBalanceHandler
)

export default fuelInRoute;
