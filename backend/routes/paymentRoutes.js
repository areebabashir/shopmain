const express = require("express");
const paymentController = require("../controllers/paymentController");
const userController = require("../controllers/userController");

const router = express.Router();

router.post("/:provider/initiate", userController.authenticate, paymentController.initiate);

module.exports = router;
