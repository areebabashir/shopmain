const mongoose = require("mongoose");
const Product = require("../models/Product");
const Review = require("../models/Review");
const { formatProduct } = require("../models/serialize");

const parseSpecs = (raw) => {
  if (raw == null || raw === "") return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const boolish = (v) => v === true || v === "true" || v === "1";

const imageUrlFromFile = (file) => (file ? `/uploads/products/${file.filename}` : "");

exports.list = async (req, res) => {
  try {
    const list = await Product.find().sort({ createdAt: 1 }).lean();
    res.json(list.map(formatProduct));
  } catch {
    res.status(500).json({ message: "Failed to load products" });
  }
};

exports.getById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Product not found" });
    }
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(formatProduct(product));
  } catch {
    res.status(500).json({ message: "Failed to load product" });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, category, price, stock, image, oldPrice, badge, specs, inStock } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ message: "name and price are required" });
    }
    const imagePath = req.file ? imageUrlFromFile(req.file) : image || "";
    const product = await Product.create({
      name,
      description: description || "",
      category: category || "General",
      price: Number(price),
      stock: Number(stock || 0),
      image: imagePath,
      oldPrice: oldPrice != null && oldPrice !== "" ? Number(oldPrice) : undefined,
      badge,
      specs: parseSpecs(specs),
      inStock: inStock == null || inStock === "" ? true : boolish(inStock),
      rating: 0,
      reviews: 0,
    });
    res.status(201).json(formatProduct(product));
  } catch {
    res.status(500).json({ message: "Failed to create product" });
  }
};

exports.update = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Product not found" });
    }
    const updates = { ...req.body };
    delete updates._id;
    if (updates.price != null && updates.price !== "") updates.price = Number(updates.price);
    if (updates.stock != null && updates.stock !== "") updates.stock = Number(updates.stock);
    if (updates.oldPrice != null && updates.oldPrice !== "") updates.oldPrice = Number(updates.oldPrice);
    if (updates.specs != null) updates.specs = parseSpecs(updates.specs);
    if (updates.inStock != null) updates.inStock = boolish(updates.inStock);
    if (req.file) {
      updates.image = imageUrlFromFile(req.file);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(formatProduct(product));
  } catch {
    res.status(500).json({ message: "Failed to update product" });
  }
};

exports.remove = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Product not found" });
    }
    await Review.deleteMany({ product: req.params.id });
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete product" });
  }
};
