const Banner = require("../models/Banner");

const imageUrlFromFile = (file) => (file ? `/uploads/banners/${file.filename}` : undefined);

exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required for banner" });
    }
    
    const banner = new Banner({
      imageUrl: imageUrlFromFile(req.file),
      title: req.body.title || "",
      subtitle: req.body.subtitle || "",
      link: req.body.link || "",
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' || req.body.isActive === true : true,
    });

    const savedBanner = await banner.save();
    res.status(201).json(savedBanner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    if (req.body.title !== undefined) banner.title = req.body.title;
    if (req.body.subtitle !== undefined) banner.subtitle = req.body.subtitle;
    if (req.body.link !== undefined) banner.link = req.body.link;
    if (req.body.isActive !== undefined) {
      banner.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }
    
    if (req.file) {
      banner.imageUrl = imageUrlFromFile(req.file);
    }

    const updatedBanner = await banner.save();
    res.json(updatedBanner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.json({ message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
