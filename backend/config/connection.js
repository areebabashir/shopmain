const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log("MONGO_URI not set.");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("Error in MongoDB Connection:", err.message);
    throw err;
  }
};

module.exports = connectDB;
