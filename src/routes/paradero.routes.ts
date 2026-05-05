import { Router } from "express";
import {
  getParaderoById,
  getParaderos,
} from "../controllers/paradero.controller";

const paraderoRouter = Router();

paraderoRouter.get("/paraderos", getParaderos);
paraderoRouter.get("/paraderos/:id", getParaderoById);

export { paraderoRouter };
