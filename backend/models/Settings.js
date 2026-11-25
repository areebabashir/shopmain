const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: "ShopVert" },
    contactEmail: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    freeShippingMinimumPkr: { type: Number, default: 5000 },
    standardShippingPkr: { type: Number, default: 250 },
    expressShippingPkr: { type: Number, default: 500 },
    logoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
