// import { Request, Response, NextFunction } from "express";
// import {
//   autoPermitAdd,
//   autoPermitGet,
//   autoPermitUpdate,
// } from "../service/autoPermit.service";
// import fMsg, { mqttEmitter } from "../utils/helper";

// export const autoPermitUpdateHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     if (!req.body.mode) throw new Error("you need mode");
//     let result = await autoPermitUpdate(req.body.mode);
//     if (!result) throw new Error("you can't update mode");
//     mqttEmitter("detpos/local_server/mode", result?.mode);
//     fMsg(res, "mode changed", result);
//   } catch (e) {
//     next(e);
//   }
// };

// export const autoPermitAddHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     if (!req.body.mode) throw new Error("you need mode");
//     let result = await autoPermitAdd(req.body);
//     fMsg(res, "auto permit added", result);
//   } catch (e) {
//     next(e);
//   }
// };

// export const autoPermitGetHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     let result = await autoPermitGet();
//     fMsg(res, "auto permit get", result);
//   } catch (e) {
//     next(e);
//   }
// };
