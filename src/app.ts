import express, { NextFunction, Request, Response } from "express";
import config from "config";
import cors from "cors";
import fileUpload from "express-fileupload";
import userRoute from "./router/user.routes";
import permitRoute from "./router/permit.routes";
import roleRoute from "./router/role.routes";
import detailSaleRoute from "./router/detailSale.routes";
import localToDeviceRoute from "./router/localToDevice.routes";
import deviceRoute from "./router/device.routes";
import dailyReportRoute from "./router/dailyReport.routes";
import { clearVoucher, deviceLiveData, liveDataChangeHandler } from "./connection/liveTimeData";
import {
  addDetailSale,
  detailSaleUpdateByDevice,
  prepareAutoPermit,
  zeroDetailSaleUpdateByDevice,
} from "./service/detailSale.service";
import dailyPriceRoute from "./router/dailyPrice.routes";
import dbConnect, { client, connect } from "./utils/connect";
import { rp, stationIdSet } from "./migrations/migrator";
import { getLastPrice } from "./service/dailyPrice.service";
import { cleanAll, get, permitNozzles, set, splitMessage, storeInCache } from "./utils/helper";
import {
  systemStatusAdd,
  systemStatusUpdate,
} from "./service/systemStatus.service";
import customerRoute from "./router/customer.routes";
import totalStatementRoute from "./router/totalStatement.routes";
import balanceStatementRoute from "./router/balanceStatement.routes";
import fuelInRoute from "./router/fuelIn.routes";
import fuelBalanceRoute from "./router/fuelBalance.routes";
import tankDataRoute from "./router/tankData.routes";
import stationRoute from "./router/station.routes";
import creditReturnRoute from "./router/creditReturn.routes";
import customerCreditRoute from "./router/customerCredit.routes";
import discountRoute from "./router/discount.routes";
import mptaRoute from "./router/mpta.routes";
import { getDeviceByNozzle } from "./service/device.service";
import { simulateFueling } from "./test/fueling";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(cors({ origin: "*" }));


const server = require("http").createServer(app);

//mqtt connection
client.on("connect", connect);
client.on("message", async (topic, message) => {
  let data = topic.split("/"); // data spliting from mqtt

  // Auto Permit Approve Feature and Semi Approve Feature by device nozzleNo

  if(data[2] == 'permit') {
    const checkNozzle = storeInCache(message.toString());

    if(checkNozzle == false) {
      permitNozzles.delete(message.toString());
      return;
    }

    await prepareAutoPermit(data[3], message.toString());
  }

  if (data[2] == "livedata") {
    // pp data come
    await liveDataChangeHandler(message.toString()); // store in cache
  }

  if (data[2] == "active") {
    // when active topic come
    // blinkLed(Number(data[3]));                                      // for blink led
  }
  
  if (data[2] == "Reload") {
    // console.log(topic, message);
    // liveDataChangeHandler(message.toString());
    const lane = topic;
    zeroDetailSaleUpdateByDevice(data[3], message.toString(), lane);
    // detailSaleUpdateByDevice(data[3], message.toString());
  }

  if (data[2] == "Final") {
    // console.log("final is here");
    // when final topic come]
    clearVoucher(message.toString());
    const lane = topic;
    await detailSaleUpdateByDevice(data[3], message.toString(), lane); // add final data to detail sale vocono
     // Remove from memory when Final is processed
  }

  

  if (data[2] == "pricereq") {
    getLastPrice(message.toString());
  }
});

//data from config
const port = config.get<number>("port");
const host = config.get<string>("host");
const wsServerUrl = config.get<string>("wsServerUrl");

// //mongodb connection
dbConnect();

//Socket connection
const io = require("socket.io-client");
let socket = io.connect(wsServerUrl);
socket.on("connect", async () => {
  console.log("connect");
  let stationId = await get("stationId");
  console.log(stationId);
  if (!stationId) {
    await stationIdSet();
    stationId = await get("stationId");
    // console.log(stationId);
  }
  // Send data to the Raspberry Pi server
  socket.emit("checkMode", stationId);

  // console.log(stationId);

  socket.on(stationId, async (data) => {
    let result = await systemStatusUpdate(data.mode);
    await set("mode", data.mode);
  });
});
socket.on("disconnect", () => {
  console.log("server disconnect");
});

//headcheck route
app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("ok");
});

// Simulate a fueling process and sending final start
app.get('/simulate', (req,res) => {
 client.publish('detpos/device/permit/1', '01permit');  

 // Start a fueling process after 2 seconds
 setTimeout(() => {
    simulateFueling(client);
 }, 2000);
});
// Simulate a fueling process and sending final end

//user route
app.use("/api/user", userRoute);
app.use("/api/permit", permitRoute); //permit route
app.use("/api/role", roleRoute); //role route

app.use("/api/detail-sale", detailSaleRoute); // detail sale route
app.use("/api/device-connection", localToDeviceRoute); // device and local server connection route
app.use("/api/device", deviceRoute); // device info route
app.use("/api/daily-report", dailyReportRoute); // sum of daily price route
app.use("/api/daily-price", dailyPriceRoute); // daily price route
// app.use("/api/auto-permit", autoPermitRoute); // auto permission route

// update route
app.use("/api/customer", customerRoute);
app.use("/api/customer-credit", customerCreditRoute);
app.use("/api/credit-return", creditReturnRoute);
app.use('/api/discount', discountRoute);
app.use("/api/total-statement", totalStatementRoute);
app.use("/api/balance-statement", balanceStatementRoute);
app.use("/api/fuelIn", fuelInRoute);

app.use("/api/fuel-balance", fuelBalanceRoute);
app.use("/api/tank-data", tankDataRoute);

app.use("/api/station", stationRoute);

app.use('/api/car-number-by-card', mptaRoute);

// error handling and response
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  err.status = err.status || 409;
  res.status(err.status).json({
    con: false,
    msg: err.message,
  });
});

const defaultData = async () => {
  //gpio led low
  // lowLed();

  await rp(); //user migration
  await cleanAll();
  systemStatusAdd();
};

// defaultData();

server.listen(port, () =>
  console.log(`server is running in  http://${host}:${port}`)
);
