import cors from "cors";
import express from "express";
import { env } from "./src/config/env";
import { busDataRouter } from "./src/routes/bus-data.routes";
import { paraderoRouter } from "./src/routes/paradero.routes";
import { positionRouter } from "./src/routes/position.routes";
import { rutaRouter } from "./src/routes/ruta.routes";
import { viajeRouter } from "./src/routes/viaje.routes";
import { startPositionPolling } from "./src/services/position.service";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    service: "TrackBus Server",
    endpoints: {
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

startPositionPolling();

app.listen(env.port, () => {
  console.log(`[HTTP] Servidor escuchando en http://localhost:${env.port}`);
});
