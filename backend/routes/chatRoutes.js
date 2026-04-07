const express = require("express");
const chatController = require("../controllers/chatController");
const userController = require("../controllers/userController");

const router = express.Router();

router.use(userController.authenticate);

router.get("/contacts", userController.authorizeAdmin, chatController.contacts);
router.get("/threads", userController.authorizeAdmin, chatController.adminThreads);
router.get("/thread", chatController.thread);
router.post("/send", chatController.send);

module.exports = router;
