const express = require("express");
const productController = require("../controllers/productController");
const userController = require("../controllers/userController");
const reviewRoutes = require("./reviewRoutes");
const uploadProductImage = require("../config/multerProduct");

const router = express.Router();

router.use("/:productId/reviews", reviewRoutes);
router.get("/", productController.list);
router.get("/:id", productController.getById);
router.post(
  "/",
  userController.authenticate,
  userController.authorizeAdmin,
  uploadProductImage.single("image"),
  productController.create
);
router.put(
  "/:id",
  userController.authenticate,
  userController.authorizeAdmin,
  uploadProductImage.single("image"),
  productController.update
);
router.delete("/:id", userController.authenticate, userController.authorizeAdmin, productController.remove);

module.exports = router;
