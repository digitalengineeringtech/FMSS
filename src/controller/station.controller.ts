import { Request, Response, NextFunction } from "express";
import fMsg from "../utils/helper";
import {
    getStation,
    addStation,
} from "../service/staion.service";


export const getStationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await getStation();
        fMsg(res, "Station are here", data);
    } catch (error) {
        next(error);
    }
}


export const addStationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await addStation(req.body);
        fMsg(res, "Station added...", data);
    } catch (error) {
        next(error);
    }
}