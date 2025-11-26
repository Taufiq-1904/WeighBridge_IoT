let ws = null;
let reconnectInterval = 2000;

// Coba koneksi WebSocket dengan auto-reconnect
function connectWS() {
  ws = new WebSocket("ws://localhost:3001");

  ws.onopen = () => {
    console.log("WS: connected");
  };

  ws.onclose = () => {
    console.log("WS: disconnected, retrying...");
    setTimeout(connectWS, reconnectInterval);
  };

  ws.onerror = () => {
    console.log("WS error");
    ws.close();
  };

  ws.onmessage = (ev) => {
    let data;

    try {
      data = JSON.parse(ev.data);
    } catch (e) {
      console.error("Invalid JSON:", ev.data);
      return;
    }

    updateUI(data);
  };
}

connectWS();

// ==============================
// UPDATE UI TANPA ERROR
// ==============================
function updateUI(data) {
  safeSet("status", data.status);
  safeSet("weight", data.weight);
}

// tidak error meski elemen tidak ada
function safeSet(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value ?? "-";
}

// ==============================
// COMMAND
// ==============================
function sendCmd(cmd) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.log("WS not ready, command skipped:", cmd);
    return;
  }
  ws.send(cmd);
}

function open1() { sendCmd("OPEN1"); }
function close1() { sendCmd("CLOSE1"); }
function open2() { sendCmd("OPEN2"); }
function close2() { sendCmd("CLOSE2"); }