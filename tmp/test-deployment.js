async function testDeployment() {
    console.log("Testing HTTPS redirect...");
    const res = await fetch("http://localhost:5000/", {
        headers: {
            "X-Forwarded-Proto": "http"
        },
        redirect: 'manual'
    });
    
    if (res.status === 302 && res.headers.get("location").startsWith("https://")) {
        console.log("HTTPS Redirect: SUCCESS");
    } else {
        console.log(`HTTPS Redirect: FAILED (Status: ${res.status})`);
    }

    console.log("\nTesting Auth Logging...");
    await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid@test.com", password: "wrong" })
    });
    console.log("Auth attempt fired. Check logs/combined.log for the winston log.");
}
testDeployment();
