const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { formatUserProfile } = require("../models/serialize");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const createToken = (user) =>
  jwt.sign({ id: String(user._id), role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });

exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: token missing" });
  }
  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
};

exports.authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin access required" });
  }
  return next();
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
    });
    const token = createToken(user);
    const fresh = await User.findById(user._id).select("-password");
    return res.status(201).json({ token, user: formatUserProfile(fresh) });
  } catch {
    return res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = createToken(user);
    const fresh = await User.findById(user._id).select("-password");
    return res.json({ token, user: formatUserProfile(fresh) });
  } catch {
    return res.status(500).json({ message: "Login failed" });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(formatUserProfile(user));
  } catch {
    return res.status(500).json({ message: "Failed to load user" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }
    const user = await User.findByIdAndUpdate(req.user.id, { name }, { new: true }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(formatUserProfile(user));
  } catch {
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ message: "current password and new password (min 6 chars) required" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    user.password = await bcrypt.hash(String(newPassword), 10);
    await user.save();
    return res.json({ message: "Password updated" });
  } catch {
    return res.status(500).json({ message: "Failed to change password" });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { label, name, address, city, zip, phone, isDefault } = req.body;
    if (!name || !address || !city) {
      return res.status(400).json({ message: "name, address and city are required" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const def = Boolean(isDefault) || user.addresses.length === 0;
    if (def) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }
    user.addresses.push({
      label: typeof label === "string" && label.trim() ? label.trim() : "Home",
      name: String(name).trim(),
      address: String(address).trim(),
      city: String(city).trim(),
      zip: zip != null ? String(zip).trim() : "",
      phone: phone != null ? String(phone).trim() : "",
      isDefault: def,
    });
    await user.save();
    return res.status(201).json(formatUserProfile(user));
  } catch {
    return res.status(500).json({ message: "Failed to add address" });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { addrId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(addrId)) {
      return res.status(404).json({ message: "Address not found" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const sub = user.addresses.id(addrId);
    if (!sub) {
      return res.status(404).json({ message: "Address not found" });
    }
    const { label, name, address, city, zip, phone, isDefault } = req.body;
    if (name != null) sub.name = String(name).trim();
    if (address != null) sub.address = String(address).trim();
    if (city != null) sub.city = String(city).trim();
    if (label != null) sub.label = String(label).trim() || "Home";
    if (zip != null) sub.zip = String(zip).trim();
    if (phone != null) sub.phone = String(phone).trim();
    if (isDefault === true) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
      sub.isDefault = true;
    }
    await user.save();
    return res.json(formatUserProfile(user));
  } catch {
    return res.status(500).json({ message: "Failed to update address" });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { addrId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(addrId)) {
      return res.status(404).json({ message: "Address not found" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const sub = user.addresses.id(addrId);
    if (!sub) {
      return res.status(404).json({ message: "Address not found" });
    }
    const wasDefault = sub.isDefault;
    sub.deleteOne();
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    await user.save();
    return res.json(formatUserProfile(user));
  } catch {
    return res.status(500).json({ message: "Failed to delete address" });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const { addrId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(addrId)) {
      return res.status(404).json({ message: "Address not found" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const sub = user.addresses.id(addrId);
    if (!sub) {
      return res.status(404).json({ message: "Address not found" });
    }
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
    sub.isDefault = true;
    await user.save();
    return res.json(formatUserProfile(user));
  } catch {
    return res.status(500).json({ message: "Failed to set default address" });
  }
};

exports.updateNotifications = async (req, res) => {
  try {
    const b = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.notificationPrefs || typeof user.notificationPrefs !== "object") {
      user.notificationPrefs = {};
    }
    if (typeof b.orderUpdates === "boolean") user.notificationPrefs.orderUpdates = b.orderUpdates;
    if (typeof b.promotional === "boolean") user.notificationPrefs.promotional = b.promotional;
    if (typeof b.newProducts === "boolean") user.notificationPrefs.newProducts = b.newProducts;
    if (typeof b.priceDrops === "boolean") user.notificationPrefs.priceDrops = b.priceDrops;
    user.markModified("notificationPrefs");
    await user.save();
    return res.json(formatUserProfile(user));
  } catch {
    return res.status(500).json({ message: "Failed to update preferences" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "password is required to delete account" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Password is incorrect" });
    }
    await User.findByIdAndDelete(req.user.id);
    return res.json({ message: "Account deleted" });
  } catch {
    return res.status(500).json({ message: "Failed to delete account" });
  }
};
