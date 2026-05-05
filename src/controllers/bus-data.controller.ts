import { Request, Response } from "express";
import { busesData } from "../models/bus.model";

export function getBuses(_req: Request, res: Response): void {
  res.json(busesData);
}

export function getBusById(req: Request, res: Response): void {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ message: "El id del bus debe ser numerico" });
    return;
  }

  const bus = busesData.find((item) => item.id === id);

  if (!bus) {
    res.status(404).json({ message: "Bus no encontrado" });
    return;
  }

  res.json(bus);
}
