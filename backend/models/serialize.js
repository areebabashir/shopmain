const mongoose = require("mongoose");
const Review = require("./Review");
const Product = require("./Product");

const asObject = (doc) => (doc.toObject ? doc.toObject() : { ...doc });

const formatProduct = (doc) => {
  const o = asObject(doc);
  const id = String(o._id);
  const { _id, __v, ...rest } = o;
  const specs = rest.specs && typeof rest.specs === "object" && !Array.isArray(rest.specs) ? rest.specs : {};
  return { ...rest, id, specs };
};

const formatUser = (doc) => {
  const o = asObject(doc);
  return { id: String(o._id), name: o.name, email: o.email, role: o.role };
};

const formatReview = (doc) => {
  const o = asObject(doc);
  const created = o.createdAt ? new Date(o.createdAt) : new Date();
  return {
    id: String(o._id),
    name: o.userName,
    avatar: o.userName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    rating: o.rating,
    date: created.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    title: o.title || "",
    text: o.text,
    helpful: o.helpful || 0,
    verified: Boolean(o.verified),
  };
};

const formatOrder = (doc) => {
  const o = asObject(doc);
  const itemCount = (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
  const created = o.createdAt ? new Date(o.createdAt) : new Date();
  return {
    id: String(o._id),
    date: created.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    status: o.status,
    total: o.totalAmount,
    items: itemCount,
    product: o.items?.[0]?.name || "Order",
    payment:
      o.payment === "cod"
        ? "Cash on Delivery"
        : o.payment === "easypaisa"
          ? "EasyPaisa"
          : o.payment === "jazcash"
            ? "JazzCash"
        : o.payment === "card"
          ? "Credit Card"
          : o.payment === "wallet"
            ? "Digital Wallet"
            : o.payment || "—",
    itemsDetail: o.items,
    shippingAddress: o.shippingAddress || {},
    delivery: o.delivery,
    totalAmount: o.totalAmount,
    shippingFee: o.shippingFee,
  };
};

const formatOrderAdmin = (orderLean) => {
  const o = orderLean;
  const u = o.userId && typeof o.userId === "object" ? o.userId : null;
  const created = o.createdAt ? new Date(o.createdAt) : new Date();
  const first = o.items?.[0];
  return {
    id: String(o._id),
    customer: u?.name || "Customer",
    email: u?.email || "—",
    phone: o.shippingAddress?.phone || "—",
    product: first?.name || "—",
    amount: `$${Number(o.totalAmount || 0).toFixed(2)}`,
    status: o.status,
    date: created.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    address: [o.shippingAddress?.address, o.shippingAddress?.city, o.shippingAddress?.zip].filter(Boolean).join(", ") || "—",
    payment:
      o.payment === "cod"
        ? "Cash on Delivery"
        : o.payment === "easypaisa"
          ? "EasyPaisa"
          : o.payment === "jazcash"
            ? "JazzCash"
        : o.payment === "card"
          ? "Credit Card"
          : o.payment === "wallet"
            ? "Wallet"
            : o.payment || "—",
    items: o.items?.reduce((s, i) => s + i.quantity, 0) || 0,
    raw: o,
  };
};

async function refreshProductReviewStats(productId) {
  const pid = typeof productId === "string" ? new mongoose.Types.ObjectId(productId) : productId;
  const agg = await Review.aggregate([
    { $match: { product: pid } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const count = agg[0]?.count || 0;
  const avg = count ? Math.round(agg[0].avg * 10) / 10 : 0;
  await Product.findByIdAndUpdate(pid, { reviews: count, rating: avg });
}

module.exports = {
  formatProduct,
  formatUser,
  formatReview,
  formatOrder,
  formatOrderAdmin,
  refreshProductReviewStats,
};
