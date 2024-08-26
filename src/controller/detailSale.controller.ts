import { Request, Response, NextFunction, query } from "express";
import fMsg, { mqttEmitter, previous } from "../utils/helper";
import {
  getDetailSale,
  addDetailSale,
  updateDetailSale,
  deleteDetailSale,
  detailSalePaginate,
  detailSaleByDate,
  detailSaleByDateAndPagi,
  detailSaleUpdateError,
  preSetDetailSale,
  initialDetail,
  updateDetailSaleByAp,
  getLastDetailSaleData,
  detailSaleStatement,
  detailSaleSummary,
  // detailSaleByDate,
} from "../service/detailSale.service";

import { deviceLiveData } from "../connection/liveTimeData";
import { getCustomerByCardId } from "../service/customer.service";
import detailSaleModel, { detailSaleDocument } from "../model/detailSale.model";
import {
  autoAddTotalBalance,
  getTotalBalance,
} from "../service/balanceStatement.service";
import deviceModel from "../model/device.model";

export const getDetailSaleHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let pageNo = Number(req.params.page);
    let { data, count } = await detailSalePaginate(pageNo, req.query);
    fMsg(res, "DetailSale are here", data, count);
  } catch (e) {
    next(e);
  }
};

export const preSetDetailSaleHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let depNo = req.query.depNo?.toString();
    let nozzleNo = req.query.nozzleNo?.toString();

    if (!depNo || !nozzleNo) {
      throw new Error("you need pumpNo or message");
    }

    let preSetKyat = req.body.kyat?.toString();
    let preSetLiter = req.body.liter?.toString();

    delete req.body.kyat;
    delete req.body.liter;

    if ((preSetKyat && preSetLiter) || (!preSetKyat && !preSetLiter))
      throw new Error("you can set one");

    let result;

    if (preSetKyat) {
      if (preSetKyat.length > 6) throw new Error("You can enter only 6 digit");
      preSetKyat = preSetKyat.padStart(7, "0");
      console.log(preSetKyat);
      result = await preSetDetailSale(
        depNo,
        nozzleNo,
        preSetKyat,
        "P",
        req.body
      );
    }

    if (preSetLiter) {
      if (preSetLiter.length > 7) throw new Error("You can enter only 6 digit");

      let arr = preSetLiter.split(".");
      // console.log(arr[1]);
      if (arr[0].length > 3 || arr[1]?.length > 3 || arr[1] == undefined) {
        throw new Error("the number format is 999.999");
      }

      let newLiter = `${arr[0].toString().padStart(4, "0")}${
        arr[1] != "" ? arr[1].toString().padEnd(3, "0") : "000"
      }`;

      console.log(newLiter);

      result = await preSetDetailSale(depNo, nozzleNo, newLiter, "L", req.body);
    }

    //hk
    // let balanceStatementData = await getTotalBalance({
    //   dateOfDay: result.dailyReportDate,
    // });

    // if (balanceStatementData.length < 1) {
    //   await autoAddTotalBalance(result.dailyReportDate);
    // }
    // that is save in data base

    fMsg(res, "New DetailSale data was added", result);
  } catch (e) {
    next(e);
  }
};

//import
export const addDetailSaleHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let depNo = req.query.depNo?.toString();
    let nozzleNo = req.query.nozzleNo?.toString();
    if (!depNo || !nozzleNo) {
      throw new Error("you need pumpNo or message");
    }

    // const lastDocument = await detailSaleModel
    //   .findOne({ nozzleNo: req.body.nozzleNo })
    //   .sort({ _id: -1, createAt: -1 });

    // if (lastDocument?.devTotalizar_liter === 0) {
    //   mqttEmitter(`detpos/local_server/reload/${depNo}`, nozzleNo);
    //   return;
    // }

    let result = await addDetailSale(depNo, nozzleNo, req.body);

    let balanceStatementData = await getTotalBalance({
      dateOfDay: result?.dailyReportDate,
    });

    // console.log(balanceStatementData);

    if (balanceStatementData.length == 0) {
      result && (await autoAddTotalBalance(result.dailyReportDate));
    }

    fMsg(res, "New DetailSale data was added", result);
  } catch (e) {
    next(e);
  }
};

export const updateDetailSaleHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let result = await updateDetailSale(req.query, req.body);
    fMsg(res, "updated DetailSale data", result);
  } catch (e) {
    next(e);
  }
};

export const detailSaleUpdateErrorHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let nozzleNo = req.query.nozzleNo;

    let [saleLiter, totalPrice] = deviceLiveData.get(nozzleNo);

    req.body = {
      ...req.body,
      saleLiter: saleLiter,
      totalPrice: totalPrice,
    };

    let result = await detailSaleUpdateError(req.query, req.body);
    fMsg(res, "updated DetailSale error data", result);
  } catch (e) {
    next(e);
  }
};

export const deleteDetailSaleHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await deleteDetailSale(req.query);
    fMsg(res, "DetailSale data was deleted");
  } catch (e) {
    next(e);
  }
};

//get detail sale between two date

export const getDetailSaleByDateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let sDate: any = req.query.sDate;
    let eDate: any = req.query.eDate;

    delete req.query.sDate;
    delete req.query.eDate;

    let query = req.query;

    if (!sDate) {
      throw new Error("you need date");
    }
    if (!eDate) {
      eDate = new Date();
    }
    //if date error ? you should use split with T or be sure detail Id
    const startDate: Date = new Date(sDate);
    const endDate: Date = new Date(eDate);
    let result = await detailSaleByDate(query, startDate, endDate);
    fMsg(res, "detail sale between two date", result);
  } catch (e) {
    next(e);
  }
};

export const getDetailSaleSummaryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let sDate: any = req.query.sDate;
    let eDate: any = req.query.eDate;

    delete req.query.sDate;
    delete req.query.eDate;

    let query = req.query;

    if (!sDate) {
      throw new Error("you need date");
    }
    if (!eDate) {
      eDate = new Date();
    }
    //if date error ? you should use split with T or be sure detail Id
    const startDate: Date = new Date(sDate);
    const endDate: Date = new Date(eDate);
    let result = await detailSaleSummary(query, startDate, endDate);
    fMsg(res, "detail sale between two date", result);
  } catch (e) {
    next(e);
  }
}

export const getDetailSaleDatePagiHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let sDate: any = req.query.sDate;
    let eDate: any = req.query.eDate;
    let pageNo: number = Number(req.params.page);

    delete req.query.sDate;
    delete req.query.eDate;

    let query = req.query;

    if (!sDate) {
      throw new Error("you need date");
    }
    if (!eDate) {
      eDate = new Date();
    }
    //if date error ? you should use split with T or be sure detail Id
    const startDate: Date = new Date(sDate);
    const endDate: Date = new Date(eDate);
    let { data, count } = await detailSaleByDateAndPagi(
      query,
      startDate,
      endDate,
      pageNo
    );

    fMsg(res, "detail sale between two date", data, count);
  } catch (e) {
    next(e);
  }
};

export const initialDetailHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("wk");
    let result = await initialDetail(req.body);
    fMsg(res, "added", result);
  } catch (e) {
    next(e);
  }
};

export const updateDetailSaleByApHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let result = await updateDetailSaleByAp(req.query._id, req.body);

    fMsg(res, "updated successfully", result);
  } catch (e) {
    next(e);
  }
};

//card attach controller

export const detailSaleUpdateByCard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cardId = req.query.cardId as string;
    const nozzleNo = req.query.nozzleNo as string;
    if (!cardId) throw new Error("invalid card");

    let customerData = await getCustomerByCardId(cardId);

    if (customerData == null) {
      // here we must add the logic for cloud data get
      // let cardDataFromCloud;
      // if (!cardDataFromCloud) throw new Error("invalid card");
      throw new Error("invalid card");
    }

    let lastData = await getLastDetailSaleData(nozzleNo);
    if (!lastData) throw new Error("Internal Error");

    lastData.vehicleType = customerData.cusVehicleType;
    lastData.carNo = customerData.cusCarNo;
    // console.log(lastData);

    let result = await updateDetailSale({ _id: lastData._id }, lastData);

    fMsg(res, "card attched successful");
  } catch (e) {
    next(e);
  }
};

export const statementReportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sDate: any = req.query.sDate;
    const eDate: any = req.query.eDate;

    delete req.query.sDate;
    delete req.query.eDate;

    const test = await deviceModel.find().lean();

    // if (!req.query.stationDetailId) throw new Error("You need stationDetailId");
    if (!sDate) throw new Error("You need start date");

    const startDate: Date = new Date(sDate);
    const endDate: Date = eDate ? new Date(eDate) : new Date();

    // const model: any = req.query.accessDb || req.body.accessDb;

    // const stationDetail = await getStationDetail(
    //   {
    //     _id: req.query.stationDetailId,
    //   },
    //   model
    // );

    const nozzleCount = test?.length;
    // const nozzleCount = stationDetail[0].nozzleCount;
    const finalData: any[] = []; // Array to store final results

    for (let i: number = 1; i <= 10; i++) {
      const noz = i.toString().padStart(2, "0");

      let query = {
        ...req.query,
        nozzleNo: noz,
      };

      const value = await detailSaleByDate(query, startDate, endDate);
      const result = value.reverse();

      // Organize data by date and include date in each entry
      const dateGroupedData: { [date: string]: any[] } = {};
      let count = result.length;
      if (count == 0) {
        query = {
          ...query,
          nozzleNo: noz,
        };
        // let lastData = await getLastDetailSale(query, model);
        let lastData = await detailSaleModel
          .findOne(query)
          .sort({ _id: -1, createAt: -1 });
        // console.log(
        //   lastData,
        //   "this is last Data....................................................."
        // );

        if (lastData) {
          let data = {
            date: "-",
            // stationId: stationDetail[0].name,
            // station: stationDetail,
            nozzle: noz,
            price: "0",
            fuelType: lastData?.fuelType,
            totalizer_opening: lastData?.devTotalizar_liter,
            totalizer_closing: lastData?.devTotalizar_liter,
            totalizer_different: 0,
            totalSaleLiter: 0,
            totalSalePrice: 0,
            other: 0,
            pumptest: 0,
          };

          finalData.push(data);
        } else {
          let data = {
            date: "-",
            // stationId: stationDetail[0].name,
            // station: stationDetail,
            nozzle: noz,
            price: "0",
            fuelType: "-",
            totalizer_opening: "0",
            totalizer_closing: "0",
            totalizer_different: 0,
            totalSaleLiter: 0,
            totalSalePrice: 0,
            other: 0,
            pumptest: 0,
          };

          finalData.push(data);
        }
      } else {
        for (const entry of result) {
          const entryDate = new Date(entry.dailyReportDate)
            .toISOString()
            .split("T")[0]; // Extract date part (YYYY-MM-DD)

          if (!dateGroupedData[entryDate]) {
            dateGroupedData[entryDate] = [];
          }

          let totalSaleLiter: number = result
            .map((ea) => ea["saleLiter"])
            .reduce((pv: number, cv: number): number => pv + cv, 0);

          let pumptest: number = result
            .filter((ea) => ea.vehicleType == "Pump Test")
            .map((ea) => ea.totalPrice)
            .reduce((pv: number, cv: number): number => pv + cv, 0);

          let data = {
            date: entryDate,
            // stationId: stationDetail[0].name,
            // station: stationDetail,
            nozzle: noz,
            fuelType: entry.fuelType,
            price: entry.salePrice,
            totalizer_opening: entry.devTotalizar_liter - entry.saleLiter,
            totalizer_closing: entry.devTotalizar_liter,
            totalizer_different:
              entry.devTotalizar_liter -
              (entry.devTotalizar_liter - entry.saleLiter),
            totalSaleLiter: entry.saleLiter,
            totalSalePrice: entry.totalPrice,
            pumptest: entry.vehicleType === "Pump Test" ? entry.saleLiter : 0,
          };

          dateGroupedData[entryDate].push(data);
        }
      }

      // Fill in data for dates with no transactions
      for (const date in dateGroupedData) {
        let totalSaleLiter = dateGroupedData[date].reduce(
          (acc, item) => acc + item.totalSaleLiter,
          0
        );
        let totalSalePrice = dateGroupedData[date].reduce(
          (acc, item) => acc + item.totalSalePrice,
          0
        );
        let pumptest = dateGroupedData[date].reduce(
          (acc, item) => acc + item.pumptest,
          0
        );

        finalData.push({
          date,
          // stationId: stationDetail[0].name,
          // station: stationDetail,
          nozzle: noz,
          fuelType: dateGroupedData[date][0]?.fuelType || "-",
          price: dateGroupedData[date][0]?.price || "0",
          totalizer_opening: dateGroupedData[date][0]?.totalizer_opening || "0",
          totalizer_closing:
            dateGroupedData[date][dateGroupedData[date].length - 1]
              ?.totalizer_closing || "0",
          totalizer_different:
            dateGroupedData[date][dateGroupedData[date].length - 1]
              ?.totalizer_closing -
              dateGroupedData[date][0]?.totalizer_opening || "0",
          totalSaleLiter: (totalSaleLiter - pumptest).toFixed(3),
          totalSalePrice: totalSalePrice.toFixed(3),
          // other: dateGroupedData[date][0]?.other,
          // Compute this if needed based on your logic
          pumptest: pumptest.toFixed(3),
          other: Math.abs(
            Number(
              dateGroupedData[date][dateGroupedData[date].length - 1]
                ?.totalizer_closing -
                dateGroupedData[date][0]?.totalizer_opening
            ) - Number(totalSaleLiter.toFixed(3))
          ),
        });
      }
    }

    fMsg(res, "Final data by date", finalData);
  } catch (e: any) {
    next(new Error(e));
  }
};

//statement

export const detailSaleStatementHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const reqDate = req.query.reqDate as string;
  if (!reqDate) throw new Error("You need date");

  let result = await detailSaleStatement(reqDate);

  fMsg(res, "statement report", result);
};
