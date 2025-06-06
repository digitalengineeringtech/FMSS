export default {
  port: 9000,
  host: "localhost",
  // dbUrl:
  //   "mongodb://detpos:asdffdsa@192.168.0.100:27017/local-pos?authSource=admin",
  dbUrl:
    "mongodb://detpos:asdffdsa@127.0.0.1:27017/local-pos?authSource=admin",
    controlDbUrl:
    "mongodb+srv://ksdbfms:Tpd7iFyquVJrh4u8@controller.zabfxgj.mongodb.net/?retryWrites=true&w=majority",
      kyawsan_DbUrl:
    "mongodb://detpos:asdffdsa@127.0.0.1:27017/HKTest?authSource=admin",
  // kyawsan_DbUrl:
  //   "mongodb+srv://ksdbfms:Asdffdsa-4580@ksfms.tfk72hu.mongodb.net/?retryWrites=true&w=majority",
  common_DbUrl:
    "mongodb://detpos:asdffdsa@127.0.0.1:27017/common?authSource=admin",
  // common_DbUrl:
  //   "mongodb+srv://ksdbfms:C9GADG2k0tLRl95C@common.advclns.mongodb.net/?retryWrites=true&w=majority",
  saltWorkFactor: 10,
  secretKey: "suuhh",
  page_limit: 50,
  // mqttUrl: "ws://127.0.0.1:9001",
  mqttUrl: "mqtt://127.0.0.1:1883",
  // mqttUrl: "mqtt://127.0.01:1883",
  mqttUserName: "detpos",
  mqttPassword: "asdffdsa",
  wsServerUrl: "http://13.251.206.31:9000/api/change-mode",

  //--------

  //--- tank data ( local atg ) -------------------------------------------------------
  //if atg => " tankDataUrl actual link " : " "
  // tankDataUrl: "",
  tankDataUrl: "https://fake-tank-data.onrender.com/api/data",
  // tankDataUrl: "https://e688ad90-86cd-43c9-a524-2aaccb212b97.mock.pstmn.io/data",
  // tankDataUrl: "http://192.168.0.105:8080/baseOilcan",

  //--- tank data ( tank data cloud ) -------------------------------------------------------
  // tankDataCloudUrl: "https://detfsmm.com/api/tank-data",
  tankDataCloudUrl: "http://127.0.01:8000/api/tank-data",

  //--- tank data ( fuel in data cloud ) -------------------------------------------------------
  // fuelInCloud: "https://detfsmm.com/api/fuelIn",
  fuelInCloud: "http://127.0.01:8000/api/fuelIn",


  // fuelBalanceCloud: "https://detfsmm.com/api/fuel-balance/check-balance",
  fuelBalanceCloud: "http://127.0.01:8000/api/fuel-balance/check-balance",

  // updateFuelBalanceCloud: "https://detfsmm.com/api/fuel-balance/local-sev",
  updateFuelBalanceCloud: "http://127.0.01:8000/api/fuel-balance/local-sev",

  // atgFuelInCloud: 'https://detfsmm.com/api/fuelIn/cloud/atg',
    atgFuelInCloud: 'http://127.0.01:8000/api/fuelIn/cloud/atg',

  //--- tank data ( voucher data cloud ) -------------------------------------------------------
  // detailsaleCloudUrl: "https://detfsmm.com/api/detail-sale",
  detailsaleCloudUrl: "http://127.0.01:8000/api/detail-sale",

  // --- user data ( user data cloud ) for check station expire date ---------------------------
  // userCloudUrl: "https://detfsmm.com/api/user/station",
  userCloudUrl: "http://127.0.0.1:8000/api/user/station",

  //coustomerCloudUrl: "http://detfsmm.com:9000/api/customer",
  // coustomerCloudUrl: "https://detfsmm.com/api/customer/local-create",
  // debtCloudUrl: "https://detfsmm.com/api/debt/local-create",
};
