import { Router } from "express";
import {
  protect,
  restrictTo,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/",
  protect,
  restrictTo("admin"),
  createProduct
);

router.patch(
  "/:id",
  protect,
  restrictTo("admin"),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  deleteProduct
);

export default router;