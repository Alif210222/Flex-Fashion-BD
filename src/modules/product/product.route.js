import { Router } from "express";

import {
  createProduct,
  getProducts,
  getAdminProducts,
  getProduct,
  getAdminProduct,
  updateProduct,
  deleteProduct,
} from "./product.controller.js";

import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  productQuerySchema,
} from "./product.validation.js";

import validate from "../../middlewares/validate.middleware.js";
import { uploadProductImages } from "../../middlewares/upload.middleware.js";

import {
  protect,
  restrictTo,
} from "../../middlewares/auth.middleware.js";

const router = Router();

// Public storefront routes
router.get("/", validate(productQuerySchema), getProducts);
// Admin routes
router.get(
  "/admin/all",
  protect,
  restrictTo("admin"),
  validate(productQuerySchema),
  getAdminProducts
);

router.get(
  "/admin/:id",
  protect,
  restrictTo("admin"),
  validate(productIdSchema),
  getAdminProduct
);


router.get("/:id", getProduct);

// // Admin routes
// router.get(
//   "/admin/all",
//   protect,
//   restrictTo("admin"),
//   validate(productQuerySchema),
//   getAdminProducts
// );



router.post(
  "/",
  protect,
  restrictTo("admin"),
  uploadProductImages,
  validate(createProductSchema),
  createProduct
);

router.patch(
  "/:id",
  protect,
  restrictTo("admin"),
  validate(productIdSchema),
  uploadProductImages,
  validate(updateProductSchema),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  validate(productIdSchema),
  deleteProduct
);

export default router;