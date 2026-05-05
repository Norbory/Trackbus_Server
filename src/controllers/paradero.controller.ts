import { Request, Response } from "express";
import { paraderosData } from "../models/paradero.model";

export function getParaderos(_req: Request, res: Response): void {
  res.json(paraderosData);
}

export function getParaderoById(req: Request, res: Response): void {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ message: "El id del paradero debe ser numerico" });
    return;
  }

  const paradero = paraderosData.find((item) => item.id === id);

  if (!paradero) {
    res.status(404).json({ message: "Paradero no encontrado" });
    return;
  }

  res.json(paradero);
}
