const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    oldPrice: Number,
    image: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    category: { type: String, default: "General" },
    badge: String,
    description: { type: String, default: "" },
    specs: { type: mongoose.Schema.Types.Mixed, default: {} },
    inStock: { type: Boolean, default: true },
    stock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
