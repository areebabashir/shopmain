const mongoose = require("mongoose");
const Order = require("../models/Order");
const { formatOrderAdmin } = require("../models/serialize");

/** Canonical provider keys (frontend may send `jazcash` for JazzCash). */
const providerConfig = {
  easypaisa: process.env.EASYPAISA_CHECKOUT_URL || "",
  jazzcash: process.env.JAZZCASH_CHECKOUT_URL || "",
};

const normalizeProvider = (raw) => {
  const p = String(raw || "").toLowerCase();
  if (p === "jazcash") return "jazzcash";
  return p;
};

const orderPaymentMatches = (orderPayment, provider) => {
  const stored = String(orderPayment || "").toLowerCase();
  if (provider === "easypaisa") return stored === "easypaisa";
  if (provider === "jazzcash") return stored === "jazzcash" || stored === "jazcash";
  return false;
};

exports.initiate = async (req, res) => {
  try {
    const provider = normalizeProvider(req.params.provider);
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
    if (!orderPaymentMatches(order.payment, provider)) {
      return res.status(400).json({ message: "Order payment method does not match selected gateway" });
    }

    const frontend = (process.env.FRONTEND_URL || "http://localhost:8080").replace(/\/$/, "");
    const returnUrl = `${frontend}/payment/return`;
    const query = new URLSearchParams({
      orderId: String(order._id),
      amount: String(order.totalAmount),
      provider,
      returnUrl,
    });

    const base = providerConfig[provider];
    const redirectUrl = base
      ? `${base}?${query.toString()}`
      : `${frontend}/payment?${query.toString()}`;

    res.json({ provider, redirectUrl, orderId: String(order._id), amount: order.totalAmount });
  } catch {
    res.status(500).json({ message: "Failed to initiate payment" });
  }
};

/** Called when customer returns from gateway or payment is verified manually. */
exports.complete = async (req, res) => {
  try {
    const { orderId, success } = req.body || {};
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Valid orderId is required" });
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (String(order.userId) !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const paid = success === true || success === "true";
    order.paymentStatus = paid ? "paid" : "failed";
    if (paid && order.status === "Awaiting Payment") {
      order.status = "Processing";
    }
    if (!paid && order.status === "Awaiting Payment") {
      order.status = "Cancelled";
    }
    await order.save();

    const populated = await Order.findById(order._id).populate("userId", "name email").lean();
    res.json(formatOrderAdmin(populated));
  } catch {
    res.status(500).json({ message: "Failed to update payment" });
  }
};
