const mongoose = require("mongoose");
const Order = require("../models/Order");

const providerConfig = {
  easypaisa: process.env.EASYPAISA_CHECKOUT_URL || "",
  jazzcash: process.env.JAZZCASH_CHECKOUT_URL || "",
};

exports.initiate = async (req, res) => {
  try {
    const provider = String(req.params.provider || "").toLowerCase();
    if (!["easypaisa", "jazzcash"].includes(provider)) {
      return res.status(400).json({ message: "Unsupported provider" });
    }
    const { orderId } = req.body || {};
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Valid orderId is required" });
    }
    const order = await Order.findById(orderId).lean();
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (String(order.userId) !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const base = providerConfig[provider];
    if (!base) {
      return res.status(400).json({ message: `${provider} gateway not configured` });
    }

    const redirectUrl = `${base}?orderId=${encodeURIComponent(String(order._id))}&amount=${encodeURIComponent(
      String(order.totalAmount)
    )}`;
    res.json({ provider, redirectUrl });
  } catch {
    res.status(500).json({ message: "Failed to initiate payment" });
  }
};
