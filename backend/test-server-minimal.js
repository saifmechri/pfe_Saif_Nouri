require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');

console.log('\n=== MINIMAL TEST SERVER ===\n');

const app = express();
app.use(cors());
app.use(express.json());

console.log('1. Testing basic route...');
app.get('/test', (req, res) => res.json({ ok: true }));
console.log('   ✓ Added /test route');

console.log('\n2. Testing chat routes mount...');
try {
  const chatRoutes = require('./routes/chat.routes');
  console.log('   ✓ chat.routes loaded');
  
  app.use('/api/chat', chatRoutes);
  console.log('   ✓ app.use("/api/chat", chatRoutes) executed');
} catch (e) {
  console.error('   ✗ Error:', e.message);
  process.exit(1);
}

console.log('\n3. Inspecting app router...');
function inspectStack(stack, prefix = '') {
  let count = 0;
  for (const layer of stack || []) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
      console.log(`  [${count}] route: ${methods} ${prefix}${layer.route.path}`);
      count++;
    } else if (layer.name === 'router' && layer.handle?.stack) {
      try {
        const source = layer.regexp.source;
        const match = source.match(/\^([^$]+)/);
        const mountPath = match ? match[1].replace(/\\\//g, '/') : '?';
        console.log(`  [${count}] router: ${mountPath}`);
        inspectStack(layer.handle.stack, prefix + mountPath);
        count++;
      } catch (e) {
        // ignore
      }
    }
  }
}
inspectStack(app._router?.stack || []);

console.log('\n4. Starting server on port 3000...\n');
const server = http.createServer(app);
server.listen(3000, () => {
  console.log('Server running on port 3000');
  console.log('\nTest requests:');
  console.log('  curl http://localhost:3000/test');
  console.log('  curl http://localhost:3000/api/chat/contacts');
  console.log('\nPress Ctrl+C to stop...\n');
});

server.on('error', (e) => {
  console.error('Server error:', e.message);
  process.exit(1);
});
