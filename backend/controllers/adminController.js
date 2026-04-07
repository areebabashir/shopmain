const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

exports.stats = async (req, res) => {
  try {
    const [orderCount, userCount, productCount, revenueAgg] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: "user" }),
      Product.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    ]);
    const revenue = revenueAgg[0]?.total || 0;
    res.json({
      orders: orderCount,
      customers: userCount,
      products: productCount,
      revenue: Math.round(revenue * 100) / 100,
    });
  } catch {
    res.status(500).json({ message: "Failed to load stats" });
  }
};

exports.customers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("name email createdAt").lean();
    const out = await Promise.all(
      users.map(async (u) => {
        const orders = await Order.countDocuments({ userId: u._id });
        const spentAgg = await Order.aggregate([
          { $match: { userId: u._id } },
          { $group: { _id: null, t: { $sum: "$totalAmount" } } },
        ]);
        const spent = spentAgg[0]?.t || 0;
        return {
          id: String(u._id),
          name: u.name,
          email: u.email,
          orders,
          spent: `$${spent.toFixed(2)}`,
          joined: u.createdAt
            ? new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : "—",
          status: orders > 10 ? "VIP" : orders > 0 ? "Active" : "Inactive",
          avatar: u.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        };
      })
    );
    res.json(out);
  } catch {
    res.status(500).json({ message: "Failed to load customers" });
  }
};
