import {
  addDeviceHandler,
  deletDeviceHandler,
  getDeviceHandler,
  updateDeviceHandler,
} from "../controller/device.controller";
import { hasAnyPermit } from "../middleware/permitValidator";
import { roleValidator } from "../middleware/roleValidator";
import { validateToken, validateToken2 } from "../middleware/validator";

const deviceRoute = require("express").Router();

deviceRoute.get("/", getDeviceHandler);
deviceRoute.post(
  "/",
  // validateToken2,
  // roleValidator(["admin", "installer"]),
  // hasAnyPermit(["add"]),
  addDeviceHandler
);

deviceRoute.patch(
  "/",
  // validateToken2,
  // roleValidator(["admin", "installer"]),
  // hasAnyPermit(["edit"]),
  updateDeviceHandler
);

deviceRoute.delete(
  "/",
  // validateToken2,
  // roleValidator(["admin", "installer"]),
  deletDeviceHandler
);

export default deviceRoute;
