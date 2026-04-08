const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

exports.stats = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [orderCount, userCount, productCount, revenueAgg, nonCancelledAgg, statusAgg, ordersToday, outOfStock, lowStock] =
      await Promise.all([
        Order.countDocuments(),
        User.countDocuments({ role: "user" }),
        Product.countDocuments(),
        Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
        Order.aggregate([
          { $match: { status: { $ne: "Cancelled" } } },
          { $group: { _id: null, total: { $sum: "$totalAmount" }, n: { $sum: 1 } } },
        ]),
        Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Order.countDocuments({ createdAt: { $gte: startOfDay } }),
        Product.countDocuments({ $or: [{ inStock: false }, { stock: { $lte: 0 } }] }),
        Product.countDocuments({ inStock: true, stock: { $gt: 0, $lte: 5 } }),
      ]);

    const revenue = Math.round((revenueAgg[0]?.total || 0) * 100) / 100;
    const avgOrderValue = nonCancelledAgg[0]?.n
      ? Math.round((nonCancelledAgg[0].total / nonCancelledAgg[0].n) * 100) / 100
      : 0;
    const ordersByStatus = { Processing: 0, "In Transit": 0, Delivered: 0, Cancelled: 0 };
    for (const row of statusAgg) {
      if (row._id && ordersByStatus[row._id] !== undefined) {
        ordersByStatus[row._id] = row.count;
      }
    }

    const monthBuckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthBuckets.push({
        y: d.getFullYear(),
        m: d.getMonth(),
        label: d.toLocaleDateString("en-US", { month: "short" }),
      });
    }

    const monthlyRevenue = await Promise.all(
      monthBuckets.map(async ({ y, m, label }) => {
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
        const agg = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
              status: { $ne: "Cancelled" },
            },
          },
          { $group: { _id: null, t: { $sum: "$totalAmount" } } },
        ]);
        const total = Math.round((agg[0]?.t || 0) * 100) / 100;
        return { label, total };
      })
    );

    const maxMonth = Math.max(...monthlyRevenue.map((x) => x.total), 1);
    const monthlyRevenueNormalized = monthlyRevenue.map((x) => ({
      ...x,
      value: Math.round((x.total / maxMonth) * 100),
    }));

    const ordersForCats = await Order.find({ status: { $ne: "Cancelled" } }).select("items").lean();
    const allIds = [
      ...new Set(ordersForCats.flatMap((o) => (o.items || []).map((i) => i.productId).filter(Boolean))),
    ];
    const validIds = allIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const products = await Product.find({ _id: { $in: validIds } }).select("category").lean();
    const catByProduct = Object.fromEntries(products.map((p) => [String(p._id), p.category || "Other"]));

    const catTotals = {};
    for (const o of ordersForCats) {
      for (const it of o.items || []) {
        const cat = catByProduct[it.productId] || "Other";
        const line = (it.quantity || 0) * (it.unitPrice || 0);
        catTotals[cat] = (catTotals[cat] || 0) + line;
      }
    }
    const catSum = Object.values(catTotals).reduce((a, b) => a + b, 0) || 1;
    const categoryRevenue = Object.entries(catTotals)
      .map(([name, rev]) => ({
        name,
        revenue: Math.round(rev * 100) / 100,
        percent: Math.round((rev / catSum) * 1000) / 10,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCustomers = await User.countDocuments({ role: "user", createdAt: { $gte: thirtyDaysAgo } });

    res.json({
      orders: orderCount,
      customers: userCount,
      products: productCount,
      revenue,
      ordersByStatus,
      ordersToday,
      outOfStock,
      lowStock,
      monthlyRevenue,
      monthlyRevenueNormalized,
      categoryRevenue,
      recentCustomers,
      avgOrderValue,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load stats" });
  }
};

exports.customers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("name email createdAt").lean();
    const orderStats = await Order.aggregate([
      { $group: { _id: "$userId", orders: { $sum: 1 }, spent: { $sum: "$totalAmount" } } },
    ]);
    const statsMap = new Map(orderStats.map((s) => [String(s._id), s]));

    const out = users.map((u) => {
      const st = statsMap.get(String(u._id));
      const orders = st?.orders || 0;
      const spent = st?.spent || 0;
        return {
          id: String(u._id),
          name: u.name,
          email: u.email,
          orders,
          spent: `Rs. ${Math.round(spent).toLocaleString("en-PK")}`,
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
    });
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load customers" });
  }
};
