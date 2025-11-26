// server.js
const express = require('express');
const path = require('path');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./db'); // pastikan ini modul MySQL/MariaDB

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// =======================
// PAGE ROUTES
// =======================
app.get('/', (req, res) => {
res.render('dashboard', { title: 'Dashboard', page: 'dashboard' });
});

app.get('/control', (req, res) => {
res.render('control', { title: 'Control Panel', page: 'control' });
});

app.get('/monitoring', (req, res) => {
res.render('monitoring', { title: 'Monitoring & Logs', page: 'monitoring' });
});

app.get('/settings', (req, res) => {
res.render('settings', { title: 'Settings', page: 'settings' });
});

// =======================
// HISTORY PAGE
// =======================
app.get('/history', async (req, res) => {
try {
const [rows] = await db.query('SELECT * FROM weight_history ORDER BY created_at DESC LIMIT 100');
res.render('history', { title: 'Riwayat Timbangan', rows });
} catch (err) {
console.error(err);
res.status(500).send('Terjadi kesalahan server');
}
});

// =======================
// API: INSERT WEIGHT
// =======================
app.post('/api/weight', async (req, res) => {
try {
const { weight } = req.body;
if (!weight) return res.status(400).json({ error: 'Weight is required' });

```
await db.query('INSERT INTO weight_history (weight) VALUES (?)', [weight]);

const data = { weight, created_at: new Date() };
io.emit('new_weight', data);

res.json({ message: 'Weight recorded', data });
```

} catch (err) {
console.error(err);
res.status(500).json({ error: 'Server error' });
}
});

// =======================
// API: GET HISTORY
// =======================
app.get('/api/history', async (req, res) => {
try {
const [rows] = await db.query('SELECT * FROM weight_history ORDER BY created_at DESC LIMIT 100');
res.json(rows);
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Server error' });
}
});

// =======================
// API: DELETE HISTORY ITEM
// =======================
app.delete('/api/history/:id', async (req, res) => {
try {
const { id } = req.params;
const [result] = await db.query('DELETE FROM weight_history WHERE id = ?', [id]);
if (result.affectedRows > 0) return res.json({ success: true });
res.json({ success: false });
} catch (err) {
console.error(err);
res.status(500).json({ success: false, error: 'Server error' });
}
});

// =======================
// SOCKET.IO
// =======================
io.on('connection', socket => {
console.log('Client connected');
socket.on('disconnect', () => console.log('Client disconnected'));
});

// =======================
// START SERVER
// =======================
server.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});
