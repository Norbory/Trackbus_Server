import { Router } from "express";
import { getViajeById, getViajes } from "../controllers/viaje.controller";

const viajeRouter = Router();

viajeRouter.get("/viajes", getViajes);
viajeRouter.get("/viajes/:id", getViajeById);

export { viajeRouter };
