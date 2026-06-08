import { Request, Response } from "express";
import paraderosData from "../data/mock/paraderos.json";
import { Paradero } from "../models/types";

export function getParaderos(_req: Request, res: Response): void {
  res.json(paraderosData as Paradero[]);
}

export function getParaderoById(req: Request, res: Response): void {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ message: "El id del paradero debe ser numerico" });
    return;
  }

  const paradero = (paraderosData as Paradero[]).find((item) => item.id === id);

  if (!paradero) {
    res.status(404).json({ message: "Paradero no encontrado" });
    return;
  }

  res.json(paradero);
}
