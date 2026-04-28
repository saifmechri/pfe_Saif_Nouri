process.stderr.write('[TEST-2] Starting test using createApp\n');

const { createApp } = require('./app');

process.stderr.write('[TEST-2] createApp imported\n');

const app = createApp();

process.stderr.write('[TEST-2] App created via createApp()\n');

const PORT = 3000;
const http = require('http');
const server = http.createServer(app);

server.listen(PORT, () => {
  process.stderr.write(`[TEST-2] Server running on port ${PORT}\n`);
});

// Test the endpoint
setTimeout(() => {
  const http_req = require('http');
  http_req.get('http://localhost:3002/api/chat/contacts', (res) => {
    process.stderr.write(`[TEST-2] /api/chat/contacts returned ${res.statusCode}\n`);
    process.exit(0);
  }).on('error', (e) => {
    process.stderr.write(`[TEST-2] Error testing endpoint: ${e.message}\n`);
    process.exit(1);
  });
}, 1000);
