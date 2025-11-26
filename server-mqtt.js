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
  console.log("✅ MQTT connected to fyuko.app:1883");

  // Subscribe to all relevant topics
  mqttClient.subscribe("ayoti/scale/status");
  mqttClient.subscribe("ayoti/scale/Wvehicle");
  mqttClient.subscribe("ayoti/scale/weight");

  console.log("📡 Subscribed to MQTT topics");
});

mqttClient.on("error", (err) => {
  console.error("❌ MQTT Error:", err.message);
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
  weight: null,
  connected: false
};

// Update connection status
mqttClient.on("connect", () => {
  latestState.connected = true;
});

mqttClient.on("close", () => {
  latestState.connected = false;
});

// ===============================
// WEBSOCKET UNTUK FRONTEND
// ===============================

const wss = new WebSocketServer({
  port: 3001
});

wss.on("connection", ws => {
  console.log("🔌 Frontend connected via WebSocket");
  ws.send(JSON.stringify(latestState));

  ws.on("message", msg => {
    const cmd = msg.toString();
    console.log("📥 Received command from WebSocket:", cmd);
    mqttClient.publish("ayoti/scale/cmd", cmd);

    // Echo back for testing
    if (cmd === "test") {
      sendTestMessage();
    }
  });

  ws.on("close", () => {
    console.log("🔌 Frontend disconnected from WebSocket");
  });
});

mqttClient.on("message", (topic, msg) => {
  const text = msg.toString().trim();
  console.log(`📨 MQTT [${topic}]: ${text}`);

  if (topic === "ayoti/scale/Wvehicle" || topic === "ayoti/scale/weight") {
    latestState.weight = parseFloat(text);
  }

  if (topic === "ayoti/scale/status") {
    latestState.status = text;
  }

  // Broadcast to all WebSocket clients
  const payload = JSON.stringify(latestState);
  wss.clients.forEach(ws => {
    if (ws.readyState === 1) {
      ws.send(payload);
    }
  });
});

// ===============================
// REST API FUNCTIONS (untuk Express)
// ===============================

/**
 * Publish command ke MQTT broker
 * @param {string} command - MQTT command (e.g., "LED_RED", "OPEN1")
 * @returns {Promise} - Promise yang resolve jika berhasil
 */
export function publishCommand(command) {
  return new Promise((resolve, reject) => {
    if (!mqttClient.connected) {
      return reject(new Error("MQTT not connected"));
    }

    console.log(`📤 Publishing command: ${command}`);
    
    mqttClient.publish("ayoti/scale/cmd", command, { qos: 1 }, (err) => {
      if (err) {
        console.error(`❌ Failed to publish: ${command}`, err);
        reject(err);
      } else {
        console.log(`✅ Command published: ${command}`);
        resolve({ success: true, command });
      }
    });
  });
}

/**
 * Get status MQTT dan data terbaru
 * @returns {Object} - Status object
 */
export function getStatus() {
  return {
    connected: mqttClient.connected,
    broker: "fyuko.app:1883",
    latestStatus: latestState.status,
    latestWeight: latestState.weight,
    timestamp: Date.now()
  };
}

/**
 * Disconnect MQTT (untuk graceful shutdown)
 */
export function disconnect() {
  if (mqttClient) {
    mqttClient.end();
    console.log("🔴 MQTT Disconnected");
  }
  if (wss) {
    wss.close();
    console.log("🔴 WebSocket Server Closed");
  }
}

// Export MQTT client jika perlu akses langsung
export { mqttClient, wss };

// ===============================
// MANUAL TEST FUNCTION (Optional)
// ===============================
// Uncomment to send test messages every 5 seconds
// setInterval(() => {
//   sendTestMessage();
// }, 5000);

console.log("🚀 MQTT Service initialized");
console.log("📡 WebSocket Server running on port 3001");