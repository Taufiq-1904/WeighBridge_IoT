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

  // Send test message after connection
  sendTestMessage();
});

// Function to send message to MQTT broker
function sendTestMessage() {
  const testWeight = Math.floor(Math.random() * 5000) + 1000; // Random weight 1000-6000
  const testStatus = "Ready";

  console.log("📤 Sending test messages to MQTT...");
  mqttClient.publish("ayoti/scale/Wvehicle", testWeight.toString());
  mqttClient.publish("ayoti/scale/status", testStatus);
  console.log(`✅ Sent - Weight: ${testWeight}, Status: ${testStatus}`);
}

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
    console.log("📥 Received command from frontend:", cmd);
    mqttClient.publish("ayoti/scale/cmd", cmd);

    // Echo back for testing
    if (cmd === "test") {
      sendTestMessage();
    }
  });
});

mqttClient.on("message", (topic, msg) => {
  const text = msg.toString().trim();
  console.log(`📨 Received MQTT message - Topic: ${topic}, Message: ${text}`);

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

// ===============================
// MANUAL TEST FUNCTION (Optional)
// ===============================
// Uncomment to send test messages every 5 seconds
// setInterval(() => {
//   sendTestMessage();
// }, 5000);
