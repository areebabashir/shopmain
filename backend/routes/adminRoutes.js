const express = require("express");
const adminController = require("../controllers/adminController");
const userController = require("../controllers/userController");

const router = express.Router();

router.get("/stats", userController.authenticate, userController.authorizeAdmin, adminController.stats);
router.get("/customers", userController.authenticate, userController.authorizeAdmin, adminController.customers);

module.exports = router;
