const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home", trim: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    zip: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const notificationPrefsSchema = new mongoose.Schema(
  {
    orderUpdates: { type: Boolean, default: true },
    promotional: { type: Boolean, default: false },
    newProducts: { type: Boolean, default: true },
    priceDrops: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    addresses: { type: [addressSchema], default: [] },
    notificationPrefs: { type: notificationPrefsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
