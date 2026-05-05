import { Response } from "express";
import mqtt, { MqttClient } from "mqtt";
import { env } from "../config/env";
import { BusPosition } from "../models/types";

let lastPosition: BusPosition | null = null;
const sseClients = new Set<Response>();
let mqttClient: MqttClient | null = null;

if (!env.mqttMock) {
  mqttClient = mqtt.connect(env.mqttUrl);

  mqttClient.on("connect", () => {
    console.log(`[MQTT] Conectado a ${env.mqttUrl}`);

    mqttClient?.subscribe(env.mqttPositionResponseTopic, (error) => {
      if (error) {
        console.error("[MQTT] Error al suscribirse:", error.message);
        return;
      }

      console.log(`[MQTT] Suscrito a ${env.mqttPositionResponseTopic}`);
    });
  });

  mqttClient.on("reconnect", () => {
    console.log("[MQTT] Reintentando conexion...");
  });

  mqttClient.on("error", (error) => {
    console.error("[MQTT] Error:", error.message);
  });

  mqttClient.on("message", (topic, payload) => {
    if (topic !== env.mqttPositionResponseTopic) {
      return;
    }

    try {
      const rawData = JSON.parse(payload.toString()) as Partial<BusPosition>;

      if (
        typeof rawData.latitude !== "number" ||
        typeof rawData.longitude !== "number"
      ) {
        console.warn("[MQTT] Mensaje ignorado: faltan coordenadas validas");
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
      console.error("[MQTT] No se pudo parsear mensaje JSON:", message);
    }
  });
} else {
  console.log("[MQTT] Modo maqueta activo: sin conexion a broker");
}

export function startPositionPolling(): void {
  setInterval(requestPositionFromBroker, 5000);
  requestPositionFromBroker();
}

function requestPositionFromBroker(): void {
  if (env.mqttMock) {
    const mockPosition = generateMockPosition();
    lastPosition = mockPosition;
    broadcastPosition(mockPosition);
    return;
  }

  const requestPayload = JSON.stringify({
    busId: env.trackedBusId,
    requestedAt: new Date().toISOString(),
  });

  mqttClient?.publish(env.mqttPositionRequestTopic, requestPayload, (error) => {
    if (error) {
      console.error("[MQTT] Error al solicitar posicion:", error.message);
    }
  });
}

function generateMockPosition(): BusPosition {
  const baseLat = 19.3209;
  const baseLng = -99.1522;
  const drift = (Math.random() - 0.5) * 0.003;

  return {
    busId: env.trackedBusId,
    latitude: Number((baseLat + drift).toFixed(6)),
    longitude: Number((baseLng + drift).toFixed(6)),
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
    source: env.mqttMock ? "mqtt-mock" : "mqtt",
    requestTopic: env.mqttPositionRequestTopic,
    responseTopic: env.mqttPositionResponseTopic,
    pollIntervalMs: 5000,
    mqttMock: env.mqttMock,
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
