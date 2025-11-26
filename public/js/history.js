/* File: history.js */

document.addEventListener('DOMContentLoaded', () => {
  // Mengambil data yang sudah didefinisikan di file EJS (window.chartData)
  // Pastikan script ini dipanggil SETELAH definisi variabel di EJS
  const { labels, weights } = window.chartData;

  const ctx = document.getElementById('historyChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Berat Kendaraan',
        data: weights,
        borderColor: '#4A90E2',
        borderWidth: 2,
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          ticks: { maxRotation: 50, minRotation: 30 }
        },
        y: {
          beginAtZero: true
        }
      }
    }
  });
});