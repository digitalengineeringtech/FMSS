import { Request, Response, NextFunction } from "express";
import fMsg from "../utils/helper";
import {
    getStation,
    addStation,
    getStations,
    updateStation,
    deleteStation,
} from "../service/staion.service";


export const getStationsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await getStations();
        fMsg(res, "Station are here", data);
    } catch (error) {
        next(error);
    }
}

export const getStationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await getStation(req.query);
        fMsg(res, "Station is here", data);
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

export const updateStationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {   
        const data = await updateStation(req.query, req.body);
        fMsg(res, "Station updated...", data);
    } catch (error) {
        next(error);
    }
}

export const deleteStationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await deleteStation(req.query);
        fMsg(res, "Station deleted...");
    } catch (error) {
        next(error);
    }
}