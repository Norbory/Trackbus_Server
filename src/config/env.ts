import "dotenv/config";

const mqttMockValue = process.env.MQTT_MOCK ?? "true";

export const env = {
  port: Number(process.env.PORT ?? 3000),
  mqttUrl: process.env.MQTT_URL ?? "mqtt://localhost:1883",
  mqttPositionRequestTopic:
    process.env.MQTT_POSITION_REQUEST_TOPIC ?? "trackbus/position/request",
  mqttPositionResponseTopic:
    process.env.MQTT_POSITION_RESPONSE_TOPIC ?? "trackbus/position/response",
  trackedBusId: process.env.TRACKED_BUS_ID ?? "BUS-001",
  mqttMock: mqttMockValue.toLowerCase() === "true",
};
