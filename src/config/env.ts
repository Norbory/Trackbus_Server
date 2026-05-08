import "dotenv/config";

const gpsMockValue = process.env.GPS_MOCK ?? "true";

export const env = {
  port: Number(process.env.PORT ?? 3000),
  trackedBusId: process.env.TRACKED_BUS_ID ?? "BUS-001",
  gpsMock: gpsMockValue.toLowerCase() === "true",
};
