const express = require('express');
const router = express.Router();

// Home / Dashboard
router.get('/', (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard',
    page: 'dashboard'
  });
});

// Control Page
router.get('/control', (req, res) => {
  res.render('control', {
    title: 'Control Panel',
    page: 'control'
  });
});

// Monitoring Page
router.get('/monitoring', (req, res) => {
  res.render('monitoring', {
    title: 'Monitoring',
    page: 'monitoring'
  });
});

// Settings Page
router.get('/settings', (req, res) => {
  res.render('settings', {
    title: 'Settings',
    page: 'settings'
  });
});

// API Routes untuk data sensor (jika butuh REST API)
router.get('/api/sensor/current', (req, res) => {
  // Kirim data sensor terkini
  res.json({
    success: true,
    data: {
      weight: Math.random() * 1000,
      temperature: 25 + Math.random() * 10,
      humidity: 60 + Math.random() * 20,
      timestamp: new Date().toISOString()
    }
  });
});

// API untuk history data
router.get('/api/sensor/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const history = [];
  
  // Generate sample history data
  for (let i = 0; i < limit; i++) {
    history.push({
      id: i + 1,
      weight: Math.random() * 1000,
      temperature: 25 + Math.random() * 10,
      humidity: 60 + Math.random() * 20,
      timestamp: new Date(Date.now() - i * 60000).toISOString()
    });
  }
  
  res.json({
    success: true,
    count: history.length,
    data: history
  });
});

// API untuk save settings
router.post('/api/settings', express.json(), (req, res) => {
  const settings = req.body;
  
  // Di sini bisa save ke database
  console.log('Settings saved:', settings);
  
  res.json({
    success: true,
    message: 'Settings saved successfully',
    data: settings
  });
});

// API untuk control commands
router.post('/api/control/tare', (req, res) => {
  // Tare (reset) weight sensor
  console.log('Tare command received');
  
  res.json({
    success: true,
    message: 'Weight sensor reset to zero'
  });
});

router.post('/api/control/calibrate', (req, res) => {
  // Calibrate sensor
  console.log('Calibration command received');
  
  res.json({
    success: true,
    message: 'Calibration started'
  });
});

// API untuk export data
router.get('/api/export/csv', (req, res) => {
  const csv = `Timestamp,Weight,Temperature,Humidity
${new Date().toISOString()},${Math.random() * 1000},${25 + Math.random() * 10},${60 + Math.random() * 20}`;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sensor-data.csv');
  res.send(csv);
});

// 404 Handler
router.use((req, res) => {
  res.status(404).render('404', {
    title: '404 Not Found',
    page: '404'
  });
});

module.exports = router;