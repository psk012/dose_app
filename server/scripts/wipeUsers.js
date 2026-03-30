require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    
    // Drop Users
    try {
        await mongoose.connection.collection("users").drop();
        console.log("Users collection dropped successfully.");
    } catch (e) {
        if (e.code === 26) {
           console.log("Users collection does not exist, nothing to drop.");
        } else {
           console.error("Error dropping users:", e);
        }
    }
    
    // Drop OTPs
    try {
        await mongoose.connection.collection("otps").drop();
        console.log("OTPs collection dropped successfully.");
    } catch (e) {
        if (e.code === 26) {
           console.log("OTPs collection does not exist, nothing to drop.");
        } else {
           console.error("Error dropping OTPs:", e);
        }
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("Connection error:", err);
    process.exit(1);
  });
