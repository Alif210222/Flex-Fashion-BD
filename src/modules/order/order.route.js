
import { Router } from "express";

import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
} from "./order.controller.js";

import {
  protect,
  optionalProtect,
  restrictTo,
} from "../../middlewares/auth.middleware.js";

import validate from "../../middlewares/validate.middleware.js";

import {
  createOrderSchema,
  orderIdSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
} from "./order.validation.js";

const router = Router();

// Guest + logged-in customer checkout
router.post(
  "/",
  optionalProtect,
  validate(createOrderSchema),
  createOrder
);

// Customer routes - login required
router.get(
  "/my-orders",
  protect,
  validate(orderQuerySchema),
  getMyOrders
);

router.get(
  "/my-orders/:id",
  protect,
  validate(orderIdSchema),
  getMyOrderById
);

router.patch(
  "/my-orders/:id/cancel",
  protect,
  validate(orderIdSchema),
  cancelMyOrder
);

// Admin routes - login + admin role required
router.get(
  "/admin/all",
  protect,
  restrictTo("admin"),
  validate(orderQuerySchema),
  getAllOrders
);

router.get(
  "/admin/:id",
  protect,
  restrictTo("admin"),
  validate(orderIdSchema),
  getAdminOrderById
);

router.patch(
  "/admin/:id/status",
  protect,
  restrictTo("admin"),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

export default router;
