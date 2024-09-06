import { Response } from "express";
import config from "config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { client } from "./connect";

const Redis = require("async-redis").createClient({
  host: "localhost",
  port: 6379,
  db: 0,
});

const saltWorkFactor = config.get<number>("saltWorkFactor");
const secretKey = config.get<string>("secretKey");
const salt = bcrypt.genSaltSync(saltWorkFactor);

//password checking and converting
export const encode = (payload: string) => bcrypt.hashSync(payload, salt);
// compare dbPass
export const compass = (payload: string, dbPass: string) => bcrypt.compareSync(payload, dbPass);
//tokenization
export const createToken = (payload: {}) => jwt.sign(payload, secretKey, { expiresIn: "24h" });
// refresh token 
export const createRefreshToken = (payload: {}) => jwt.sign(payload, secretKey, { expiresIn: "7d" });
// check token 
export const checkToken = (payload: string): any => jwt.verify(payload, secretKey);

//get prev date
export let previous = (date = new Date()) => {
  let previousDate = new Date();
  previousDate.setDate(date.getDate() - 1);

  return previousDate.toLocaleDateString(`fr-CA`);
};

//for response
const fMsg = (
  res: Response,
  msg: string = "all success",
  result: any = [],
  totalCount: number | null = null
) => {
  if (totalCount != null) {
    res.status(200).json({ con: true, msg, result, totalCount });
  } else {
    console.log("wk6");
    res.status(200).json({ con: true, msg, result });
  }
};

export const fMsg2 = (
  res: Response,
  status: number = 200,
  msg: string = "all success",
  result: any = []
) => {
  res.status(status).json({ con: true, msg, result });
};

export const mqttEmitter = (topic: string, message: string) => {
  client.publish(topic, message);
};

export const set = async (id, value) =>
  await Redis.set(id.toString(), JSON.stringify(value));
export const get = async (id) => JSON.parse(await Redis.get(id.toString()));
export const drop = async (id: any) => await Redis.del(id.toString());

export const cleanAll = async () => await Redis.flushdb();

export const presetFormat = (preset) => {
    const result = preset.split(" ");
   
    return {
      preset: result[0],
      type: result[1]
    }
}

export default fMsg;
