const mongoose = require("mongoose");
const Product = require("../models/Product");
const Review = require("../models/Review");
const User = require("../models/User");
const { formatReview, refreshProductReviewStats } = require("../models/serialize");

exports.list = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(404).json({ message: "Product not found" });
    }
    const exists = await Product.exists({ _id: productId });
    if (!exists) {
      return res.status(404).json({ message: "Product not found" });
    }
    const list = await Review.find({ product: productId }).sort({ createdAt: -1 }).lean();
    res.json(list.map(formatReview));
  } catch {
    res.status(500).json({ message: "Failed to load reviews" });
  }
};

exports.create = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(404).json({ message: "Product not found" });
    }
    const { rating, title, text } = req.body;
    const r = Number(rating);
    if (!text || !Number.isFinite(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: "rating (1-5) and text are required" });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const dup = await Review.findOne({ product: productId, user: user._id });
    if (dup) {
      return res.status(409).json({ message: "You already reviewed this product" });
    }
    const review = await Review.create({
      product: product._id,
      user: user._id,
      userName: user.name,
      rating: r,
      title: title || "",
      text,
      verified: true,
    });
    await refreshProductReviewStats(product._id);
    res.status(201).json(formatReview(review));
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ message: "You already reviewed this product" });
    }
    res.status(500).json({ message: "Failed to submit review" });
  }
};
