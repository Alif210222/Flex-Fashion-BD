import * as authService from "./auth.service.js";
import catchAsync from "../../utils/catchAsync.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

export const register = catchAsync(async (req, res) => {
  const { user, accessToken } = await authService.createUser(
    req.body
  );

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      user: sanitizeUser(user),
      accessToken,
      tokenType: "Bearer",
    },
  });
});

export const login = catchAsync(async (req, res) => {
  const { user, accessToken } = await authService.loginUser(
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: sanitizeUser(user),
      accessToken,
      tokenType: "Bearer",
    },
  });
});

export const getMe = catchAsync(async (req, res) => {
  const user = await authService.getProfile(req.user._id);

  res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: {
      user: sanitizeUser(user),
    },
  });
});

export const updateMe = catchAsync(async (req, res) => {
  const user = await authService.updateProfile(
    req.user._id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: sanitizeUser(user),
    },
  });
});