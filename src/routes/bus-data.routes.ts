import { Router } from "express";
import { getBusById, getBuses } from "../controllers/bus-data.controller";

const busDataRouter = Router();

busDataRouter.get("/buses", getBuses);
busDataRouter.get("/buses/:id", getBusById);

export { busDataRouter };
