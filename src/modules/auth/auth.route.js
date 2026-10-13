import { Router } from "express";

import {
  register,
  login,
  getMe,
  updateMe,
} from "./auth.controller.js";

import validate from "../../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "./auth.validation.js";

import {
  protect,
  restrictTo,
} from "../../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Authenticated routes
router.get("/me", protect, getMe);
router.patch("/me", protect, validate(updateProfileSchema), updateMe);

// Example of how protected admin routes should be configured:
// router.get("/admin-example", protect, restrictTo("admin"), handler);

export default router;