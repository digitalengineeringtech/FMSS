import { Response } from "express";
import config from "config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { client } from "./connect";
import { Schema } from "mongoose";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { getDeviceByNozzle } from "../service/device.service";

const Redis = require("async-redis").createClient({
  host: "localhost",
  port: 6379,
  db: 0,
});

const saltWorkFactor = config.get<number>("saltWorkFactor");
const secretKey = config.get<string>("secretKey");
const salt = bcrypt.genSaltSync(saltWorkFactor);

// check permit nozzle exist or not 
// if exist delete that nozzle number from cache or else set in cache
export const permitNozzles = new Map();

//password checking and converting
export const encode = (payload: string) => bcrypt.hashSync(payload, salt);
export const compass = (payload: string, dbPass: string) =>
  bcrypt.compareSync(payload, dbPass);

//tokenization
export const createToken = (payload: {}) =>
  jwt.sign(payload, secretKey, { expiresIn: "24h" });
export const checkToken = (payload: string): any =>
  jwt.verify(payload, secretKey);

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
  totalCount: number | null = null,
  totalPrice: number | null = null,
  totalLiter: number | null = null
) => {
  if (totalCount != null) {
    res.status(200).json({ 
      con: true, 
      msg, 
      result, 
      totalCount,  
      totalPrice,
      totalLiter 
    });
  } else {
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

export const formatDecimal = (value: string | number | undefined): string => {
  // decimal value with 3 decimal points
  return value ? parseFloat(value.toString()).toFixed(3) : '0.000';
}

export const formatPrice = (value: string | number | undefined): string => {
  // only comma separated value 
  return value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '0';
}

// helpers function for all model format decimal 
export const virtualFormat = (model: Schema, fields: string[]) => {
  model.virtual("formatted").get(function () {
    const formattedFields: Record<string, string> = {};

    fields.map((field) => {
      if (this[field] !== undefined) {
        formattedFields[field] = formatDecimal(this[field]);
      }
    });

    return formattedFields;
  });

  // Ensure virtuals are included in JSON and Object outputs
  model.set("toJSON", { virtuals: true });
  model.set("toObject", { virtuals: true });

  // Add lean virtuals plugin for performance
  model.plugin(mongooseLeanVirtuals);
};

export const splitMessage = (message: string) => {
  const result = message.match(/[0-9]+/g);

  return result ? result : [];
};

export const calculateDiscount = (subTotal, type, amount) => {
  if (type === "amount") {
    return subTotal - amount;
  } else {
    return subTotal - (subTotal * amount) / 100;
  }
}


// helpers function for store permit nozzles
export const storeInCache = (key) => {
    const result = splitMessage(key);

    if(permitNozzles.has(result[0])) {
        console.log(`Nozzle ${result[0]} is already approved and fueling....`);

        return false;
    } else {
      permitNozzles.set(result[0], true);
      return true;
    }   
}

export default fMsg;
