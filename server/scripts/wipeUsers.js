require("dotenv").config();
const mongoose = require("mongoose");

const COLLECTIONS_TO_DROP = [
    "users",
    "otps",
    "journals",
    "moodentries",
    "reflections",
    "focussessions",
    "safetynetconfigs",
    "riskassessments",
    "alertlogs",
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    
    for (const name of COLLECTIONS_TO_DROP) {
        try {
            await mongoose.connection.collection(name).drop();
            console.log(`✅ ${name} — dropped`);
        } catch (e) {
            if (e.code === 26) {
               console.log(`⬚  ${name} — does not exist, skipped`);
            } else {
               console.error(`❌ ${name} — error:`, e.message);
            }
        }
    }

    console.log("\n🧹 Database wipe complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Connection error:", err);
    process.exit(1);
  });
