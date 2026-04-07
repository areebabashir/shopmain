const express = require("express");
const reviewController = require("../controllers/reviewController");
const userController = require("../controllers/userController");

const router = express.Router({ mergeParams: true });

router.get("/", reviewController.list);
router.post("/", userController.authenticate, reviewController.create);

module.exports = router;
