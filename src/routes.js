import { Router } from "express";
import CrawlerCtrl from "./controllers/CrawlerCtrl.js";

const routes = new Router();

routes.post("/buscar", CrawlerCtrl);

export default routes;
