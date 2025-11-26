const socket = io();

socket.on('sensorData', (data) => {
  document.getElementById('weight').textContent = data.weight.toFixed(2) + ' kg';
  document.getElementById('temperature').textContent = data.temperature.toFixed(1) + ' °C';
  document.getElementById('humidity').textContent = data.humidity.toFixed(1) + ' %';
});