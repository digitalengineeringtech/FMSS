import {
  addTankDataHandler,
  deleteTankDataHandler,
  getTankDataHandler,
  updateTankDataHandler,
} from "../controller/tankData.controller";

const tankDataRoute = require("express").Router();

tankDataRoute.get(
  "/pagi/:page",
  // validateToken,
  // hasAnyPermit(["view"]),
  getTankDataHandler
);

tankDataRoute.post(
  "/",
  // validateToken2,
  // validateAll(TankDataSchema)
  // roleValidator(["admin", "installer"]),
  // hasAnyPermit(["add"]),
  addTankDataHandler
);

tankDataRoute.patch(
  "/",
  // validateToken,
  // roleValidator(["admin"]),
  // hasAnyPermit(["edit"]),
  updateTankDataHandler
);

tankDataRoute.delete(
  "/",
  // validateToken2,
  // roleValidator(["admin", "installer"]),
  // hasAnyPermit(["delete"]),
  deleteTankDataHandler
);

export default tankDataRoute;
