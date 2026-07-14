import * as http from "http";
import { IncomingMessage } from "http";
import { Response } from "express";
import { WebSocket, WebSocketServer } from "ws";
import { env } from "../config/env";
import { BusPosition } from "../models/types";
import paraderosData from "../data/mock/paraderos.json";

let lastPosition: BusPosition | null = null;
const sseClients = new Set<Response>();

type RutaParaderoRaw = {
  id_ruta?: string;
  sentido?: "ida" | "vuelta";
  orden?: number;
  latitude?: number;
  longitude?: number;
};

type Point = {
  latitude: number;
  longitude: number;
};

const SUR_ROUTE_ID = "sur";
const SUR_ROUTE_DIRECTION = "ida";
const SUR_ROUTE_LOOP_DURATION_MS = 2 * 60 * 60 * 1000;
const POLL_INTERVAL_MS = 5000;
const SUR_ROUTE_POINTS = buildSurRoutePoints();
const SUR_ROUTE_DISTANCE_KM = computeTotalDistanceKm(SUR_ROUTE_POINTS);
const SUR_ROUTE_SPEED_KMH =
  SUR_ROUTE_DISTANCE_KM > 0
    ? Number((SUR_ROUTE_DISTANCE_KM / 2).toFixed(1))
    : 20;

const mockStartTime = Date.now();

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
  setInterval(generateAndBroadcastMock, POLL_INTERVAL_MS);
  generateAndBroadcastMock();
}

function generateAndBroadcastMock(): void {
  const position = generateMockPosition();
  lastPosition = position;
  broadcastPosition(position);
}

function generateMockPosition(): BusPosition {
  const now = Date.now();
  const elapsed = (now - mockStartTime) % SUR_ROUTE_LOOP_DURATION_MS;
  const progress = elapsed / SUR_ROUTE_LOOP_DURATION_MS;

  const currentPoint = getPointAtProgress(progress);
  const nextPoint = getPointAtProgress((progress + 0.002) % 1);

  const heading = calculateHeading(
    currentPoint.latitude,
    currentPoint.longitude,
    nextPoint.latitude,
    nextPoint.longitude,
  );

  return {
    busId: env.trackedBusId,
    id_ruta: SUR_ROUTE_ID,
    latitude: Number(currentPoint.latitude.toFixed(6)),
    longitude: Number(currentPoint.longitude.toFixed(6)),
    speedKmh: SUR_ROUTE_SPEED_KMH,
    heading,
    timestamp: new Date().toISOString(),
  };
}

function buildSurRoutePoints(): Point[] {
  const paraderos = (paraderosData as RutaParaderoRaw[])
    .filter(
      (paradero) =>
        paradero.id_ruta === SUR_ROUTE_ID &&
        paradero.sentido === SUR_ROUTE_DIRECTION &&
        typeof paradero.latitude === "number" &&
        typeof paradero.longitude === "number",
    )
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((paradero) => ({
      latitude: paradero.latitude as number,
      longitude: paradero.longitude as number,
    }));

  if (paraderos.length >= 2) return paraderos;

  return [
    { latitude: -12.061294, longitude: -77.085867 },
    { latitude: -12.077358, longitude: -77.084443 },
  ];
}

function computeTotalDistanceKm(points: Point[]): number {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    total += haversineKm(points[i], points[i + 1]);
  }

  return total;
}

function getPointAtProgress(progress: number): Point {
  if (SUR_ROUTE_POINTS.length === 0) {
    return { latitude: -12.061294, longitude: -77.085867 };
  }

  if (SUR_ROUTE_POINTS.length === 1) {
    return SUR_ROUTE_POINTS[0];
  }

  const targetDistance = SUR_ROUTE_DISTANCE_KM * Math.max(0, Math.min(progress, 1));

  let accumulated = 0;
  for (let i = 0; i < SUR_ROUTE_POINTS.length - 1; i += 1) {
    const start = SUR_ROUTE_POINTS[i];
    const end = SUR_ROUTE_POINTS[i + 1];
    const segmentDistance = haversineKm(start, end);

    if (accumulated + segmentDistance >= targetDistance) {
      const remaining = targetDistance - accumulated;
      const ratio = segmentDistance > 0 ? remaining / segmentDistance : 0;

      return {
        latitude: start.latitude + (end.latitude - start.latitude) * ratio,
        longitude: start.longitude + (end.longitude - start.longitude) * ratio,
      };
    }

    accumulated += segmentDistance;
  }

  return SUR_ROUTE_POINTS[SUR_ROUTE_POINTS.length - 1];
}

function haversineKm(a: Point, b: Point): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function calculateHeading(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);

  return Math.round((toDeg(Math.atan2(y, x)) + 360) % 360);
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
