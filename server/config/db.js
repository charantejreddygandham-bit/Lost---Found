const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_lost_found';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected: ${uri}`);
  } catch (err) {
    console.error('\nCould not connect to MongoDB at ' + uri);
    console.error('Reason: ' + err.message);
    console.error('\nFix: start a local MongoDB (e.g. "mongod" service) or run "docker compose up -d" in the project root.\n');
    process.exit(1);
  }
}

module.exports = connectDB;
