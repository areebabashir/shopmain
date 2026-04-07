require("dotenv").config({ quiet: true });

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/connection");
const User = require("../models/User");

const email = (process.env.SEED_ADMIN_EMAIL || "admin@localhost").toLowerCase().trim();
const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
const name = (process.env.SEED_ADMIN_NAME || "Admin").trim();

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("Set MONGO_URI in .env");
    process.exit(1);
  }

  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    console.error("MongoDB not connected.");
    process.exit(1);
  }

  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn("Using default password admin123. Set SEED_ADMIN_PASSWORD in .env for production.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let user = await User.findOne({ email });

  if (user) {
    let changed = false;
    if (user.role !== "admin") {
      user.role = "admin";
      changed = true;
    }
    if (process.env.SEED_ADMIN_RESET_PASSWORD === "1") {
      user.password = hashedPassword;
      changed = true;
    }
    if (changed) {
      await user.save();
      console.log(`Updated user ${email} (admin role${process.env.SEED_ADMIN_RESET_PASSWORD === "1" ? ", password reset" : ""}).`);
    } else {
      console.log(`User ${email} already exists as admin. Set SEED_ADMIN_RESET_PASSWORD=1 to reset password.`);
    }
  } else {
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });
    console.log(`Created admin: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
