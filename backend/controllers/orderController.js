const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { formatOrder, formatOrderAdmin } = require("../models/serialize");

const ALLOWED_PAYMENTS = ["cod", "easypaisa", "jazcash"];

exports.create = async (req, res) => {
  try {
    const { items, shippingAddress, delivery, payment, shippingFee } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items array is required" });
    }
    const normalizedItems = [];
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ message: "One or more products are invalid" });
      }
      const product = await Product.findById(item.productId).lean();
      if (!product) {
        return res.status(400).json({ message: "One or more products are invalid" });
      }
      const qty = Number(item.quantity || 1);
      normalizedItems.push({
        productId: String(product._id),
        name: product.name,
        quantity: qty,
        unitPrice: product.price,
        image: product.image || "",
      });
    }
    const subtotal = normalizedItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const fee = Number(shippingFee || 0);
    const totalAmount = subtotal + fee;

    const paymentMethod = String(payment || "cod").toLowerCase();
    if (!ALLOWED_PAYMENTS.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const isGateway = paymentMethod === "easypaisa" || paymentMethod === "jazcash";

    const order = await Order.create({
      userId: req.user.id,
      items: normalizedItems,
      shippingAddress: shippingAddress || {},
      delivery: delivery || "standard",
      payment: paymentMethod,
      paymentStatus: "pending",
      shippingFee: fee,
      totalAmount,
      status: isGateway ? "Awaiting Payment" : "Processing",
    });

    const populated = await Order.findById(order._id).populate("userId", "name email").lean();
    res.status(201).json(formatOrder(populated));
  } catch {
    res.status(500).json({ message: "Failed to place order" });
  }
};

exports.myOrders = async (req, res) => {
  try {
    const list = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(list.map((o) => formatOrder(o)));
  } catch {
    res.status(500).json({ message: "Failed to load orders" });
  }
};

exports.listAll = async (req, res) => {
  try {
    const list = await Order.find().populate("userId", "name email").sort({ createdAt: -1 }).lean();
    res.json(list.map((o) => formatOrderAdmin(o)));
  } catch {
    res.status(500).json({ message: "Failed to load orders" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Awaiting Payment", "Processing", "In Transit", "Delivered", "Cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Order not found" });
    }
    const existing = await Order.findById(req.params.id).lean();
    if (!existing) {
      return res.status(404).json({ message: "Order not found" });
    }

    const gateway = existing.payment === "easypaisa" || existing.payment === "jazcash";
    const unpaid = (existing.paymentStatus || "pending") !== "paid";
    if (gateway && unpaid && ["Processing", "In Transit", "Delivered"].includes(status)) {
      return res.status(400).json({
        message: "Cannot fulfill this order until online payment is confirmed",
      });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate("userId", "name email")
      .lean();
    res.json(formatOrderAdmin(order));
  } catch {
    res.status(500).json({ message: "Failed to update order" });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!["paid", "failed"].includes(paymentStatus)) {
      return res.status(400).json({ message: "paymentStatus must be paid or failed" });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Order not found" });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.paymentStatus = paymentStatus;
    if (paymentStatus === "paid" && order.status === "Awaiting Payment") {
      order.status = "Processing";
    }
    if (paymentStatus === "failed" && order.status === "Awaiting Payment") {
      order.status = "Cancelled";
    }
    await order.save();

    const populated = await Order.findById(order._id).populate("userId", "name email").lean();
    res.json(formatOrderAdmin(populated));
  } catch {
    res.status(500).json({ message: "Failed to update payment status" });
  }
};
