import cors from "cors";
import express from "express";
import * as http from "http";
import { env } from "./src/config/env";
import { busDataRouter } from "./src/routes/bus-data.routes";
import { paraderoRouter } from "./src/routes/paradero.routes";
import { positionRouter } from "./src/routes/position.routes";
import { rutaRouter } from "./src/routes/ruta.routes";
import { viajeRouter } from "./src/routes/viaje.routes";
import {
  createGpsWebSocketServer,
  startMockPositionPolling,
} from "./src/services/position.service";

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    service: "TrackBus Server",
    endpoints: {
      gpsWebSocket: `ws://host:${env.port}/ws/gps`,
      realtimePosition: "/api/position/realtime",
      mobileStream: "/api/mobile/position/stream",
      mobileLastPosition: "/api/mobile/position/latest",
      buses: "/api/buses",
      paraderos: "/api/paraderos",
      rutas: "/api/rutas",
      viajes: "/api/viajes",
    },
  });
});

app.use("/api", positionRouter);
app.use("/api", busDataRouter);
app.use("/api", paraderoRouter);
app.use("/api", rutaRouter);
app.use("/api", viajeRouter);

createGpsWebSocketServer(server);
startMockPositionPolling();

server.listen(env.port, () => {
  console.log(`[HTTP] Servidor escuchando en http://localhost:${env.port}`);
  console.log(
    `[WS-GPS] WebSocket GPS disponible en ws://localhost:${env.port}/ws/gps`
  );
});
