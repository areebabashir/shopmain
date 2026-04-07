const mongoose = require("mongoose");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");
const Product = require("../models/Product");

const toUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
});

const toMessage = (m) => ({
  id: String(m._id),
  senderId: String(m.sender),
  recipientId: String(m.recipient),
  text: m.text || "",
  product: m.product || null,
  createdAt: m.createdAt,
});

const getAllAdminIds = async () => {
  const admins = await User.find({ role: "admin" }).select("_id").lean();
  return admins.map((a) => a._id);
};

const resolvePeerForUser = async (authUser, withId) => {
  if (authUser.role === "admin") {
    if (!withId || !mongoose.Types.ObjectId.isValid(withId)) return null;
    const peer = await User.findById(withId).select("name email role").lean();
    if (!peer) return null;
    return peer;
  }
  const admin = await User.findOne({ role: "admin" }).sort({ createdAt: 1 }).select("name email role").lean();
  return admin || null;
};

exports.contacts = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("name email role").sort({ createdAt: -1 }).lean();
    res.json(users.map(toUser));
  } catch {
    res.status(500).json({ message: "Failed to load contacts" });
  }
};

exports.adminThreads = async (req, res) => {
  try {
    const adminIds = await getAllAdminIds();
    const users = await User.find({ role: "user" }).select("name email role").sort({ createdAt: -1 }).lean();
    const rows = await Promise.all(
      users.map(async (u) => {
        const last = await ChatMessage.findOne({
          $or: [
            { sender: { $in: adminIds }, recipient: u._id },
            { sender: u._id, recipient: { $in: adminIds } },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();
        return {
          user: toUser(u),
          lastMessage: last
            ? {
                text: last.text || "",
                hasProduct: Boolean(last.product),
                createdAt: last.createdAt,
              }
            : null,
        };
      })
    );
    rows.sort((a, b) => {
      const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return tb - ta;
    });
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Failed to load chat threads" });
  }
};

exports.thread = async (req, res) => {
  try {
    const authId = req.user.id;
    const withId = req.query.with;
    const peer = await resolvePeerForUser(req.user, withId);
    if (!peer) return res.json({ peer: null, messages: [] });

    const me = await User.findById(authId).select("name email role").lean();
    if (!me) return res.status(401).json({ message: "User not found" });

    let messages = [];
    if (req.user.role === "admin") {
      const adminIds = await getAllAdminIds();
      messages = await ChatMessage.find({
        $or: [
          { sender: { $in: adminIds }, recipient: peer._id },
          { sender: peer._id, recipient: { $in: adminIds } },
        ],
      })
        .sort({ createdAt: 1 })
        .lean();
    } else {
      const adminIds = await getAllAdminIds();
      messages = await ChatMessage.find({
        $or: [
          { sender: me._id, recipient: { $in: adminIds } },
          { sender: { $in: adminIds }, recipient: me._id },
        ],
      })
        .sort({ createdAt: 1 })
        .lean();
    }

    res.json({
      peer: toUser(peer),
      messages: messages.map(toMessage),
    });
  } catch {
    res.status(500).json({ message: "Failed to load messages" });
  }
};

exports.send = async (req, res) => {
  try {
    const authId = req.user.id;
    const { text, with: withId, productId } = req.body || {};
    const peer = await resolvePeerForUser(req.user, withId);
    if (!peer) return res.status(400).json({ message: "Chat partner not found" });

    const cleaned = typeof text === "string" ? text.trim() : "";
    let productPayload;
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product" });
      }
      const p = await Product.findById(productId).lean();
      if (!p) return res.status(404).json({ message: "Product not found" });
      productPayload = {
        productId: String(p._id),
        name: p.name,
        image: p.image || "",
        price: Number(p.price || 0),
      };
    }

    if (!cleaned && !productPayload) {
      return res.status(400).json({ message: "Message text or product is required" });
    }

    const created = await ChatMessage.create({
      sender: authId,
      recipient: peer._id,
      text: cleaned,
      product: productPayload,
    });

    res.status(201).json(toMessage(created));
  } catch {
    res.status(500).json({ message: "Failed to send message" });
  }
};
