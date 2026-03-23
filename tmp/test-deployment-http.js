const http = require('http');

const optionsAuth = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Forwarded-Proto': 'https'
  }
};
const reqAuth = http.request(optionsAuth, (res) => {
  console.log('Auth attempt completed with status:', res.statusCode);
});
reqAuth.write(JSON.stringify({ email: "invalid@test.com", password: "wrong" }));
reqAuth.end();
