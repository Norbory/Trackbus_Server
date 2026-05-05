import { Request, Response } from "express";
import {
  addSseClient,
  getLatestPosition,
  getRealtimeMeta,
  removeSseClient,
} from "../services/position.service";

export function getRealtimePosition(_req: Request, res: Response): void {
  res.json(getRealtimeMeta());
}

export function getMobileLatestPosition(_req: Request, res: Response): void {
  const lastPosition = getLatestPosition();

  if (!lastPosition) {
    res.status(404).json({
      message: "Aun no hay posicion disponible del bus",
    });
    return;
  }

  res.json(lastPosition);
}

export function streamMobilePosition(req: Request, res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write("event: connected\n");
  res.write("data: Conexion SSE establecida\n\n");

  addSseClient(res);

  req.on("close", () => {
    removeSseClient(res);
  });
}
