import { getCreditDetailSaleDatePagiHandler, getCreditDetailSaleOnlyPagiHandler, getCreditDetailSalePagiHandler, getDetailSaleSummaryDetailHandler, getDetailSaleSummaryHandler, getDetailSaleWithoutPagiHandler, getTotalizerDifferenceHandler, statementReportHandler } from './../controller/detailSale.controller';
import {
  addDetailSaleHandler,
  deleteDetailSaleHandler,
  detailSaleStatementHandler,
  detailSaleUpdateByCard,
  detailSaleUpdateErrorHandler,
  getDetailSaleByDateHandler,
  getDetailSaleDatePagiHandler,
  getDetailSaleHandler,
  initialDetailHandler,
  preSetDetailSaleHandler,
  updateDetailSaleByApHandler,
  updateDetailSaleHandler,
} from "../controller/detailSale.controller";
import { managerValidator } from "../middleware/managerValidator";

import { hasAnyPermit } from "../middleware/permitValidator";
import { roleValidator } from "../middleware/roleValidator";
import {
  checkExpire,
  validateAll,
  validateToken,
  validateToken2,
} from "../middleware/validator";
import {
  allSchemaId,
  apSchema,
  detailSaleErrorUpdateSchema,
  detailSaleSchema,
  detailSaleUpdateSchema,
} from "../schema/schema";

const detailSaleRoute = require("express").Router();

detailSaleRoute.get(
  "/pagi/:page",
  validateToken2,
  hasAnyPermit(["view"]),
  getDetailSaleHandler
);

detailSaleRoute.get(
  "/by-date",
  validateToken2,
  hasAnyPermit(["view"]),
  getDetailSaleByDateHandler
);

detailSaleRoute.get(
  '/sale-summary',
  validateToken2,
  hasAnyPermit(["view"]),
  getDetailSaleSummaryHandler
);

detailSaleRoute.get(
  '/sale-summary-detail',
  validateToken2,
  hasAnyPermit(["view"]),
  getDetailSaleSummaryDetailHandler
);



detailSaleRoute.get(
  "/pagi/by-date/:page",
  validateToken2,
  hasAnyPermit(["view"]),
  getDetailSaleDatePagiHandler
);

detailSaleRoute.get(
  "/credit/pagi/:page",
  validateToken2,
  hasAnyPermit(["view"]),
  getCreditDetailSalePagiHandler
)

detailSaleRoute.get(
  "/credit/only-pagi/:page",
  validateToken2,
  hasAnyPermit(["view"]),
  getCreditDetailSaleOnlyPagiHandler
)

detailSaleRoute.get(
  "/credit/pagi/by-date/:page",
  validateToken2,
  hasAnyPermit(["view"]),
  getCreditDetailSaleDatePagiHandler
);

detailSaleRoute.get(
  "/without-pagi/by-date",
  validateToken2,
  hasAnyPermit(["view"]),
  getDetailSaleWithoutPagiHandler
);

//that for only device
detailSaleRoute.post(
  "/",
  validateToken,
  checkExpire,
  validateAll(detailSaleSchema),
  addDetailSaleHandler
);

detailSaleRoute.post(
  "/preset",
  validateToken,
  checkExpire,
  validateAll(detailSaleSchema),
  preSetDetailSaleHandler
);

detailSaleRoute.patch(
  "/update",
  validateToken,
  // checkExpire,
  validateAll(allSchemaId),
  updateDetailSaleHandler
);

detailSaleRoute.patch(
  "/error",
  validateToken,
  managerValidator,
  detailSaleUpdateErrorHandler
);

detailSaleRoute.delete(
  "/",
  validateToken2,
  roleValidator(["admin", "installer"]),
  // hasAnyPermit(["delete"]),
  validateAll(allSchemaId),
  deleteDetailSaleHandler
);

detailSaleRoute.post(
  "/initial",
  validateToken2,
  roleValidator(["admin", "installer"]),
  hasAnyPermit(["add"]),
  initialDetailHandler
);

detailSaleRoute.post(
  "/ap-update",
  validateToken,
  validateAll(apSchema),
  updateDetailSaleByApHandler
);

detailSaleRoute.post(
  "/statement-report",
  // validateToken,
  statementReportHandler
);



//new fms update
detailSaleRoute.get(
  "/total_statement",
  validateToken,
  detailSaleStatementHandler
);
detailSaleRoute.patch("/customer_card", validateToken, detailSaleUpdateByCard);

// totalizer difference route
detailSaleRoute.get(
  "/totalizer-difference/by-date",
  validateToken,
  roleValidator(["manager"]),
  hasAnyPermit(["view"]),
  getTotalizerDifferenceHandler
);

export default detailSaleRoute;
