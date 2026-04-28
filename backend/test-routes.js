require("dotenv").config();
const { createApp } = require('./app');

const app = createApp();

console.log('\n=== Registered Routes ===\n');

function inspect(stack, prefix = '') {
  for (const layer of stack || []) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
      const fullPath = prefix + layer.route.path;
      console.log(`${methods.padEnd(6)} ${fullPath}`);
    } else if (layer.name === 'router' && layer.handle?.stack) {
      let mountPath = '';
      try {
        const regexSource = layer.regexp.source;
        // Extract mount path from regex like /^\/api\/chat\//
        const match = regexSource.match(/^\/\^(.+?)\//);
        if (match) {
          mountPath = match[1]
            .replace(/\\\//g, '/')
            .replace(/^\\/, '');
        }
      } catch (e) {
        // ignore
      }
      if (layer.handle.stack) {
        inspect(layer.handle.stack, prefix + mountPath);
      }
    }
  }
}

inspect(app._router?.stack || []);

console.log('\n=== Checking specific chat route ===\n');
try {
  const chatRoutes = require('./routes/chat.routes');
  console.log('✓ chat.routes loaded OK');
  console.log('  Stack length:', chatRoutes.stack.length);
  if (chatRoutes.stack[0]) {
    console.log('  First route path:', chatRoutes.stack[0].route.path);
    console.log('  Methods:', Object.keys(chatRoutes.stack[0].route.methods));
  }
} catch (e) {
  console.error('✗ chat.routes FAILED:', e.message);
}

console.log('\n=== Checking routes/index registerRoutes ===\n');
try {
  // First, try to require each route individually
  console.log('Testing individual route requires:');
  const auth = require('./routes/auth');
  console.log('  ✓ auth');
  const vehicules = require('./routes/vehicules');
  console.log('  ✓ vehicules');
  const pieces = require('./routes/piece.routes');
  console.log('  ✓ pieces');
  const recommendations = require('./routes/recommendations');
  console.log('  ✓ recommendations');
  const garages = require('./routes/garage.routes');
  console.log('  ✓ garages');
  const chat = require('./routes/chat.routes');
  console.log('  ✓ chat');
  
  const { registerRoutes } = require('./routes');
  console.log('\n✓ registerRoutes exports OK');
  const testApp = require('express')();
  console.log('Calling registerRoutes(testApp)...');
  registerRoutes(testApp);
  console.log('✓ registerRoutes(testApp) executed successfully');
  
  console.log('\nRouter stack after registerRoutes:');
  const stack = testApp._router?.stack || [];
  console.log(`  Total stack items: ${stack.length}`);
  for (const [idx, l] of stack.entries()) {
    if (l.name === 'router') {
      try {
        const source = l.regexp.source;
        console.log(`  [${idx}] router: ${source}`);
        if (source.includes('chat')) {
          console.log('    ^ Found chat route!');
        }
      } catch (e) {
        console.log(`  [${idx}] router: (error: ${e.message})`);
      }
    } else if (l.route) {
      console.log(`  [${idx}] route: ${l.route.path}`);
    } else {
      console.log(`  [${idx}] other: ${l.name}`);
    }
  }
  
} catch (e) {
  console.error('✗ FAILED:', e.message);
  console.error(e.stack);
}
