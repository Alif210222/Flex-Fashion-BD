
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

import { protect, restrictTo } from "../../middlewares/auth.middleware.js";
import  validate  from "../../middlewares/validate.middleware.js";

import {
  createOrderSchema,
  orderIdSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
} from "./order.validation.js";

const router = Router();

// Every order route requires login.
router.use(protect);

// Customer routes
router.post("/", validate(createOrderSchema), createOrder);
router.get("/my-orders", validate(orderQuerySchema), getMyOrders);
router.get("/my-orders/:id", validate(orderIdSchema), getMyOrderById);
router.patch(
  "/my-orders/:id/cancel",
  validate(orderIdSchema),
  cancelMyOrder
);

// Admin routes
router.get(
  "/admin/all",
  restrictTo("admin"),
  validate(orderQuerySchema),
  getAllOrders
);

router.get(
  "/admin/:id",
  restrictTo("admin"),
  validate(orderIdSchema),
  getAdminOrderById
);

router.patch(
  "/admin/:id/status",
  restrictTo("admin"),
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

export default router;
