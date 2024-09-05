
const stationRoute = require("express").Router();
import { validateToken } from "../middleware/validator";
import { getStationHandler, addStationHandler} from "../controller/station.controller";

stationRoute.get("/",
    // validateToken, 
    getStationHandler
);

stationRoute.post("/", 
    // validateToken, 
    addStationHandler
);

export default stationRoute;

