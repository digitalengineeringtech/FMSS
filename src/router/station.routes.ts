
const stationRoute = require("express").Router();
import { validateToken } from "../middleware/validator";
import { getStationHandler, addStationHandler, getStationsHandler, updateStationHandler, deleteStationHandler} from "../controller/station.controller";

stationRoute.get("/",
    validateToken, 
    getStationsHandler
);

stationRoute.get("/:id",
    validateToken, 
    getStationHandler
);

stationRoute.post("/", 
    validateToken, 
    addStationHandler
);

stationRoute.put("/:id",
    validateToken,
    updateStationHandler
);

stationRoute.delete("/:id",
    validateToken,
    deleteStationHandler
);

export default stationRoute;

