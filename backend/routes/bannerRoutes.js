const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController");
const uploadBannerImage = require("../config/multerBanner");
const userController = require("../controllers/userController");

// Public route to fetch banners
router.get("/", bannerController.getBanners);

// Admin routes
router.post("/", userController.authenticate, userController.authorizeAdmin, uploadBannerImage.single("image"), bannerController.createBanner);
router.put("/:id", userController.authenticate, userController.authorizeAdmin, uploadBannerImage.single("image"), bannerController.updateBanner);
router.delete("/:id", userController.authenticate, userController.authorizeAdmin, bannerController.deleteBanner);

module.exports = router;
