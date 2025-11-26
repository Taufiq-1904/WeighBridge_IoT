const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression()); // Compress responses
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  res.render('dashboard', { 
    title: 'Dashboard',
    page: 'dashboard'
  });
});

app.get('/control', (req, res) => {
  res.render('control', { 
    title: 'Control Panel',
    page: 'control'
  });
});

app.get('/monitoring', (req, res) => {
  res.render('monitoring', { 
    title: 'Monitoring & Logs',
    page: 'monitoring'
  });
});

app.get('/settings', (req, res) => {
  res.render('settings', { 
    title: 'Settings',
    page: 'settings'
  });
});

// API endpoints (untuk integrasi dengan MQTT handler)
app.get('/api/status', (req, res) => {
  // Data akan diambil dari MQTT handler
  res.json({
    gate: 'closed',
    led: 'off',
    buzzer: 'off',
    weight: 0,
    sensor: 'active'
  });
});

app.get('/api/logs', (req, res) => {
  // Data akan diambil dari database/MQTT
  res.json([
    {
      id: 1,
      timestamp: new Date().toISOString(),
      weight: 5000,
      event: 'entry'
    }
  ]);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});