const express = require("express");
const orderController = require("../controllers/orderController");
const userController = require("../controllers/userController");

const router = express.Router();

router.post("/", userController.authenticate, orderController.create);
router.get("/my", userController.authenticate, orderController.myOrders);
router.get("/", userController.authenticate, userController.authorizeAdmin, orderController.listAll);
router.patch("/:id/status", userController.authenticate, userController.authorizeAdmin, orderController.updateStatus);

module.exports = router;
