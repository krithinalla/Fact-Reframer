// start-app.js - Helper script to start the application
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Fact Reframer application...');

// Start backend server
const backendServer = spawn('node', ['backend_server.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: 3001 }
});

console.log('Backend server started on port 3001');

// Wait a moment for the backend to initialize
setTimeout(() => {
  // Start React development server
  const reactServer = spawn('npx', ['react-scripts', 'start'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: 3000, BROWSER: 'none' }
  });
  
  console.log('React development server started on port 3000');
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down servers...');
    backendServer.kill();
    reactServer.kill();
    process.exit(0);
  });
  
  backendServer.on('close', (code) => {
    console.log(`Backend server exited with code ${code}`);
    reactServer.kill();
    process.exit(code);
  });
  
  reactServer.on('close', (code) => {
    console.log(`React server exited with code ${code}`);
    backendServer.kill();
    process.exit(code);
  });
  
}, 2000);

console.log('Once servers are started, navigate to http://localhost:3000 in your browser'); 