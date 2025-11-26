// server-mqtt.js
import mqtt from "mqtt";
import { WebSocketServer } from "ws";

// ===============================
// MQTT CONNECT
// ===============================

const mqttClient = mqtt.connect({
  host: "fyuko.app",
  port: 1883,
  username: "",
  password: ""
});

mqttClient.on("connect", () => {
  console.log("MQTT connected");

  mqttClient.subscribe("ayoti/scale/status");
  mqttClient.subscribe("ayoti/scale/Wvehicle");
});

let latestState = {
  status: null,
  weight: null
};

// ===============================
// WEBSOCKET UNTUK FRONTEND
// ===============================

const wss = new WebSocketServer({
  port: 3001
});

wss.on("connection", ws => {
  console.log("Frontend connected");
  ws.send(JSON.stringify(latestState));

  ws.on("message", msg => {
    const cmd = msg.toString();
    mqttClient.publish("ayoti/scale/cmd", cmd);
  });
});

mqttClient.on("message", (topic, msg) => {
  const text = msg.toString().trim();

  if (topic === "ayoti/scale/Wvehicle") {
    latestState.weight = parseFloat(text);
  }

  if (topic === "ayoti/scale/status") {
    latestState.status = text;
  }

  const payload = JSON.stringify(latestState);

  wss.clients.forEach(ws => {
    if (ws.readyState === 1) {
      ws.send(payload);
    }
  });
});
