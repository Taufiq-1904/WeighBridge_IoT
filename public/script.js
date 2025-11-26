const ws = new WebSocket("ws://localhost:3001");

ws.onmessage = ev => {
  const data = JSON.parse(ev.data);

  if (data.status !== null) {
    document.getElementById("status").textContent = data.status;
  }

  if (data.weight !== null) {
    document.getElementById("weight").textContent = data.weight;
  }
};

function open1() {
  ws.send("OPEN1");
}

function close1() {
  ws.send("CLOSE1");
}
