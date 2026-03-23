const fs = require('fs');
fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'password123' })
}).then(res => res.text()).then(text => {
    fs.writeFileSync('err.txt', text);
});
