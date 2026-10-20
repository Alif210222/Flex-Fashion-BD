
import { Router } from "express";

import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "./cart.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import  validate  from "../../middlewares/validate.middleware.js";

import {
  addCartItemSchema,
  updateCartItemSchema,
  removeCartItemSchema,
} from "./cart.validation.js";

const router = Router();

router.use(protect);

router.get("/", getCart);

router.post(
  "/items",
  validate(addCartItemSchema),
  addCartItem
);

router.patch(
  "/items/:sku",
  validate(updateCartItemSchema),
  updateCartItem
);

router.delete(
  "/items/:sku",
  validate(removeCartItemSchema),
  removeCartItem
);

router.delete("/", clearCart);

export default router;
