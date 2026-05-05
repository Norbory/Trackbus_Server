import { Router } from "express";
import { getRutaById, getRutas } from "../controllers/ruta.controller";

const rutaRouter = Router();

rutaRouter.get("/rutas", getRutas);
rutaRouter.get("/rutas/:id", getRutaById);

export { rutaRouter };
