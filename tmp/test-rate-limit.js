async function testLimits() {
    for (let i = 1; i <= 6; i++) {
        const res = await fetch("http://localhost:5000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: `test10${i}@test.com`, password: "password123" })
        });
        if (res.status === 500) {
            const text = await res.text();
            const match = text.match(/<pre>(.*?)<\/pre>/s);
            console.log(`Request ${i} Failed 500. Stack: \n${match ? match[1] : text.substring(0, 100)}`);
        } else {
            console.log(`Request ${i}: ${res.status}`);
        }
    }
}
testLimits();
