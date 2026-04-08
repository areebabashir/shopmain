const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/me", userController.authenticate, userController.me);
router.patch("/profile", userController.authenticate, userController.updateProfile);
router.patch("/password", userController.authenticate, userController.changePassword);
router.post("/addresses", userController.authenticate, userController.addAddress);
router.patch("/addresses/:addrId/default", userController.authenticate, userController.setDefaultAddress);
router.patch("/addresses/:addrId", userController.authenticate, userController.updateAddress);
router.delete("/addresses/:addrId", userController.authenticate, userController.deleteAddress);
router.patch("/notifications", userController.authenticate, userController.updateNotifications);
router.delete("/account", userController.authenticate, userController.deleteAccount);

module.exports = router;
