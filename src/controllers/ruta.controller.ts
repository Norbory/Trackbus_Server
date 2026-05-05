import { Request, Response } from "express";
import { rutasData } from "../models/ruta.model";

export function getRutas(_req: Request, res: Response): void {
  res.json(rutasData);
}

export function getRutaById(req: Request, res: Response): void {
  const id = req.params.id;
  const ruta = rutasData.find((item) => item.id === id);

  if (!ruta) {
    res.status(404).json({ message: "Ruta no encontrada" });
    return;
  }

  res.json(ruta);
}
