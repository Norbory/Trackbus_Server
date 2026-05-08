import * as http from "http";
import { IncomingMessage } from "http";
import { Response } from "express";
import { WebSocket, WebSocketServer } from "ws";
import { env } from "../config/env";
import { BusPosition } from "../models/types";

let lastPosition: BusPosition | null = null;
const sseClients = new Set<Response>();

export function createGpsWebSocketServer(server: http.Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws/gps" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const ip = req.socket.remoteAddress;
    console.log(`[WS-GPS] Dispositivo conectado desde ${ip}`);

    ws.on("message", (data) => {
      try {
        const rawData = JSON.parse(data.toString()) as Partial<BusPosition>;

        if (
          typeof rawData.latitude !== "number" ||
          typeof rawData.longitude !== "number"
        ) {
          console.warn("[WS-GPS] Mensaje ignorado: faltan coordenadas validas");
          return;
        }

        const position: BusPosition = {
          busId: rawData.busId ?? env.trackedBusId,
          latitude: rawData.latitude,
          longitude: rawData.longitude,
          speedKmh: rawData.speedKmh,
          heading: rawData.heading,
          timestamp: rawData.timestamp ?? new Date().toISOString(),
        };

        lastPosition = position;
        broadcastPosition(position);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[WS-GPS] No se pudo parsear mensaje JSON:", message);
      }
    });

    ws.on("close", () => {
      console.log("[WS-GPS] Dispositivo desconectado");
    });

    ws.on("error", (error) => {
      console.error("[WS-GPS] Error:", error.message);
    });
  });

  return wss;
}

export function startMockPositionPolling(): void {
  if (!env.gpsMock) return;
  setInterval(generateAndBroadcastMock, 5000);
  generateAndBroadcastMock();
}

function generateAndBroadcastMock(): void {
  const position = generateMockPosition();
  lastPosition = position;
  broadcastPosition(position);
}

function generateMockPosition(): BusPosition {
  const baseLat = -12.0569;
  const baseLng = -77.0849;
  const latVariance = 0.0007;
  const lngVariance = 0.0007;

  const latDrift = (Math.random() - 0.5) * latVariance;
  const lngDrift = (Math.random() - 0.5) * lngVariance;

  return {
    busId: env.trackedBusId,
    latitude: Number((baseLat + latDrift).toFixed(6)),
    longitude: Number((baseLng + lngDrift).toFixed(6)),
    speedKmh: Math.round(15 + Math.random() * 25),
    heading: Math.round(Math.random() * 359),
    timestamp: new Date().toISOString(),
  };
}

function broadcastPosition(position: BusPosition): void {
  const message = `data: ${JSON.stringify(position)}\n\n`;

  for (const client of sseClients) {
    client.write(message);
  }
}

export function getLatestPosition(): BusPosition | null {
  return lastPosition;
}

export function getRealtimeMeta() {
  return {
    source: env.gpsMock ? "gps-mock" : "websocket",
    gpsEndpoint: "/ws/gps",
    pollIntervalMs: env.gpsMock ? 5000 : null,
    gpsMock: env.gpsMock,
    latestPosition: lastPosition,
  };
}

export function addSseClient(client: Response): void {
  sseClients.add(client);

  if (lastPosition) {
    client.write(`data: ${JSON.stringify(lastPosition)}\n\n`);
  }
}

export function removeSseClient(client: Response): void {
  sseClients.delete(client);
}
