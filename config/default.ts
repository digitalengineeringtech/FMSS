export default {
  port: 9000,
  host: "localhost",
  // dbUrl:
  //   "mongodb://detpos:asdffdsa@192.168.1.146:27017/local-pos?authSource=admin",
  dbUrl:
    "mongodb://detpos:asdffdsa@192.168.0.100:27017/local-pos?authSource=admin",
  saltWorkFactor: 10,
  secretKey: "suuhh",
  page_limit: 50,
  // mqttUrl: "ws://127.0.0.1:9001",
  mqttUrl: "mqtt://127.0.0.1:1883",
  // mqttUrl: "mqtt://192.168.1.146:1883",
  mqttUserName: "detpos",
  mqttPassword: "asdffdsa",
  wsServerUrl: "http://13.251.206.31:9000/api/change-mode",

  //--- tank data ( local atg ) -------------------------------------------------------
  //if atg => " tankDataUrl actual link " : " "
  // tankDataUrl: "",
  // tankDataUrl: "https://e688ad90-86cd-43c9-a524-2aaccb212b97.mock.pstmn.io/data",
  tankDataUrl: "http://192.168.0.109:8080/baseOilcan",

  //--- tank data ( tank data cloud ) -------------------------------------------------------
  tankDataCloudUrl: "https://detfsmm.com/api/tank-data",
  // tankDataCloudUrl: "http://192.168.1.146:8000/api/tank-data",

  //--- tank data ( fuel in data cloud ) -------------------------------------------------------
  fuelInCloud: "https://detfsmm.com/api/fuelIn",
  // fuelInCloud: "http://192.168.1.146:8000/api/fuelIn",

  atgFuelInCloud: 'https://detfsmm.com/api/fuelIn/cloud/atg',
  //   atgFuelInCloud: 'http://192.168.1.146:8000/api/fuelIn/cloud/atg',

  //--- tank data ( voucher data cloud ) -------------------------------------------------------
  detailsaleCloudUrl: "https://detfsmm.com/api/detail-sale",
  // detailsaleCloudUrl: "http://192.168.1.146:8000/api/detail-sale",

  //coustomerCloudUrl: "http://detfsmm.com:9000/api/customer",
  // coustomerCloudUrl: "https://detfsmm.com/api/customer/local-create",
  // debtCloudUrl: "https://detfsmm.com/api/debt/local-create",
};
