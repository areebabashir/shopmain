const Settings = require("../models/Settings");

const imageUrlFromFile = (file) => (file ? `/uploads/settings/${file.filename}` : undefined);

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne().lean();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to load settings" });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Convert numeric fields
    if (updates.freeShippingMinimumPkr != null) updates.freeShippingMinimumPkr = Number(updates.freeShippingMinimumPkr);
    if (updates.standardShippingPkr != null) updates.standardShippingPkr = Number(updates.standardShippingPkr);
    if (updates.expressShippingPkr != null) updates.expressShippingPkr = Number(updates.expressShippingPkr);

    if (req.file) {
      updates.logoUrl = imageUrlFromFile(req.file);
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(updates);
      await settings.save();
    } else {
      Object.assign(settings, updates);
      await settings.save();
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to update settings" });
  }
};
