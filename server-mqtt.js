import mqtt from "mqtt";
import { WebSocketServer } from "ws";
import db from "./db.js";

// =============================================
// MQTT CLIENT ke broker HiveMQ (untuk sensor langsung)
// =============================================
const client = mqtt.connect("mqtt://broker.hivemq.com");

client.on("connect", () => {
  console.log("MQTT Connected to HiveMQ");
  client.subscribe("weighbridge/weight");
});

client.on("message", async (topic, message) => {
  const weight = Number(message.toString());

  console.log("Received weight:", weight);

  try {
    await db.query(
      "INSERT INTO weight_history (weight) VALUES (?)",
      [weight]
    );

    console.log("Weight saved to DB (HiveMQ)");
  } catch (err) {
    console.error("DB insert error:", err);
  }
});



// =============================================
// MQTT CLIENT ke fyuko.app (untuk device proyekmu)
// =============================================
const mqttClient = mqtt.connect({
  host: "fyuko.app",
  port: 1883,
  username: "",
  password: ""
});

let latestState = {
  status: null,
  weight: null,
  connected: false
};

mqttClient.on("connect", () => {
  latestState.connected = true;

  console.log("MQTT connected to fyuko.app:1883");

  mqttClient.subscribe("ayoti/scale/status");
  mqttClient.subscribe("ayoti/scale/Wvehicle");
  mqttClient.subscribe("ayoti/scale/weight");

  console.log("Subscribed to ayoti/*");
});

mqttClient.on("close", () => {
  latestState.connected = false;
});

mqttClient.on("message", async (topic, msg) => {
  const text = msg.toString().trim();
  console.log(`MQTT [${topic}]: ${text}`);

  if (topic === "ayoti/scale/Wvehicle" || topic === "ayoti/scale/weight") {
    latestState.weight = parseFloat(text);

    // SAVE TO DB
    try {
      await db.query(
        "INSERT INTO weight_history (weight) VALUES (?)",
        [latestState.weight]
      );
      console.log("Weight saved to DB (fyuko.app)");
    } catch (err) {
      console.error("DB insert error:", err);
    }
  }

  if (topic === "ayoti/scale/status") {
    latestState.status = text;
  }

  // Broadcast ke semua browser
  const payload = JSON.stringify(latestState);
  wss.clients.forEach(ws => {
    if (ws.readyState === 1) ws.send(payload);
  });
});



// =============================================
// WEBSOCKET UNTUK FRONTEND real-time
// =============================================
const wss = new WebSocketServer({ port: 3001 });

wss.on("connection", ws => {
  console.log("Frontend connected via WebSocket");
  ws.send(JSON.stringify(latestState));

  ws.on("message", msg => {
    const cmd = msg.toString();
    console.log("WS CMD:", cmd);

    mqttClient.publish("ayoti/scale/cmd", cmd);

    if (cmd === "test") {
      const testWeight = Math.floor(Math.random() * 5000) + 1000;
      mqttClient.publish("ayoti/scale/weight", testWeight.toString());
    }
  });
});



// =============================================
// EXPORT UTILITY FUNCS UNTUK EXPRESS
// =============================================
export function publishCommand(command) {
  return new Promise((resolve, reject) => {
    if (!mqttClient.connected) {
      return reject(new Error("MQTT not connected"));
    }

    mqttClient.publish("ayoti/scale/cmd", command, { qos: 1 }, err => {
      if (err) reject(err);
      else resolve({ success: true, command });
    });
  });
}

export function getStatus() {
  return {
    connected: mqttClient.connected,
    broker: "fyuko.app:1883",
    latestStatus: latestState.status,
    latestWeight: latestState.weight,
    timestamp: Date.now()
  };
}

export function disconnect() {
  mqttClient.end();
  wss.close();
  console.log("MQTT & WS Disconnected");
}

console.log("MQTT Service initialized");
console.log("WebSocket running on :3001");

