const express = require("express");
const settingsController = require("../controllers/settingsController");
const userController = require("../controllers/userController");
const uploadSettingsImage = require("../config/multerSettings");

const router = express.Router();

router.get("/", settingsController.getSettings);
router.put(
  "/",
  userController.authenticate,
  userController.authorizeAdmin,
  uploadSettingsImage.single("logo"),
  settingsController.updateSettings
);

module.exports = router;
