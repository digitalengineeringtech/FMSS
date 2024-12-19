import { addMptaHandler, getMptaHandler } from "../controller/mpta.controller";

const mptaRoute = require("express").Router();

mptaRoute.get('/', getMptaHandler);

mptaRoute.post('/create', addMptaHandler);

export default mptaRoute;