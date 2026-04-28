process.stderr.write('[TEST] Starting test app\n');

const express = require('express');
const cors = require('cors');
const path = require('path');

process.stderr.write('[TEST] Dependencies loaded\n');

const { registerRoutes } = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

process.stderr.write('[TEST] registerRoutes and errorHandler loaded\n');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

process.stderr.write('[TEST] Core middleware setup done\n');

app.get('/', (req, res) => {
  res.json({ message: 'OK' });
});

process.stderr.write('[TEST] About to call registerRoutes\n');
registerRoutes(app);
process.stderr.write('[TEST] registerRoutes completed\n');

// Try direct mount too
try {
  const chatRoutes = require('./routes/chat.routes');
  app.use('/api/chat', chatRoutes);
  process.stderr.write('[TEST] Chat routes mounted directly\n');
} catch (e) {
  process.stderr.write('[TEST] Failed to mount chat routes: ' + e.message + '\n');
}

app.use(errorHandler);
process.stderr.write('[TEST] errorHandler attached\n');

const PORT = 3001;
const http = require('http');
const server = http.createServer(app);

server.listen(PORT, () => {
  process.stderr.write(`[TEST] Server running on port ${PORT}\n`);
});

// Test the endpoint
setTimeout(() => {
  const http_req = require('http');
  http_req.get('http://localhost:3000/api/chat/contacts', (res) => {
    process.stderr.write(`[TEST] /api/chat/contacts returned ${res.statusCode}\n`);
    process.exit(0);
  }).on('error', (e) => {
    process.stderr.write(`[TEST] Error testing endpoint: ${e.message}\n`);
    process.exit(1);
  });
}, 1000);
