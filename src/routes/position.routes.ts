import { Router } from "express";
import {
  getMobileLatestPosition,
  getRealtimePosition,
  streamMobilePosition,
} from "../controllers/position.controller";

const positionRouter = Router();

positionRouter.get("/position/realtime", getRealtimePosition);
positionRouter.get("/mobile/position/latest", getMobileLatestPosition);
positionRouter.get("/mobile/position/stream", streamMobilePosition);

export { positionRouter };
