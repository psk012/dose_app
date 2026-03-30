/**
 * 🔥 Reset Database Script
 * Drops the entire doseDB database — all collections, all data.
 * Usage: node scripts/resetDb.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    await mongoose.connection.db.dropDatabase();
    console.log('✅ Database dropped successfully! Fresh start ready.');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to reset database:', err.message);
    process.exit(1);
  }
}

resetDatabase();
