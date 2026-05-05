import { Request, Response } from "express";
import { viajesData } from "../models/viaje.model";

export function getViajes(_req: Request, res: Response): void {
  res.json(viajesData);
}

export function getViajeById(req: Request, res: Response): void {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ message: "El id del viaje debe ser numerico" });
    return;
  }

  const viaje = viajesData.find((item) => item.id === id);

  if (!viaje) {
    res.status(404).json({ message: "Viaje no encontrado" });
    return;
  }

  res.json(viaje);
}
