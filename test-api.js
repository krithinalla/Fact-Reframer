// test-api.js
const fetch = require('node-fetch');

console.log('Testing backend API...');

// Test server connection
fetch('http://localhost:3001/api/test')
  .then(response => response.json())
  .then(data => {
    console.log('Server test result:', data);
    return fetch('http://localhost:3001/api/test-gemini');
  })
  .then(response => response.json())
  .then(data => {
    console.log('Gemini API test result:', data);
    console.log('API tests completed successfully!');
  })
  .catch(error => {
    console.error('API test failed:', error);
    process.exit(1);
  }); 