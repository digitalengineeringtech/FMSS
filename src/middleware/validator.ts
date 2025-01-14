import { NextFunction, Response, Request } from "express";
import { checkToken, get } from "../utils/helper";
import { getUser } from "../service/user.service";
import { checkStationExpire } from "../utils/control";

export const validateAll =
  (schema: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      let result = await schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (e: any) {
      return next(new Error(e.errors[0].message));
    }
  };
export const validateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let mode = await get("mode");
    if (mode == "dead") throw new Error("Your are out of service");

    let token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return next(new Error("invalid token"));
    }
    let decoded = checkToken(token);

    // let user = await getUser({ _id: decoded._id });
    let user = await get(decoded?._id);
    if (!user) {
      return next(new Error("invalid token 2"));
    }
    req.body = req.body || {};
    req.body.user = user;
    next();
  } catch (e) {
    next(e);
  }
};
export const validateToken2 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("invalid token"));
    }
    let decoded = checkToken(token);
    req.body = req.body || {};
    req.body.user = decoded;
    next();
  } catch (e) {
    next(new Error(e));
  }
};

export const checkExpire = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stationId = await get("stationId");

    const station = await checkStationExpire(stationId);

    if(!station) {
        return next(new Error("Station not found"));
    }

    const expireDate = new Date(station.result.expireDate);
    const today = new Date();

    if(expireDate < today) {
        return next(new Error("Your are out of service"));
    }
    
    next();
  } catch (e) {
    next(new Error(e));
  }
};