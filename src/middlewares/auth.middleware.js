
import jwt from "jsonwebtoken";
import User from "../modules/auth/auth.model.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

// Shared authentication logic
const authenticateUser = async (req) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError("Please Login !", 401);
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    throw new AppError("Please Login !", 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }

  if (!decoded.sub) {
    throw new AppError("Invalid access token", 401);
  }

  const user = await User.findById(decoded.sub);

  if (!user || !user.isActive) {
    throw new AppError("Account not found or inactive", 401);
  }

  req.user = user;

  return user;
};

// Required authentication
export const protect = catchAsync(async (req, res, next) => {
  await authenticateUser(req);
  next();
});

// Optional authentication
export const optionalProtect = catchAsync(async (req, res, next) => {
  const authorization = req.headers.authorization;

  // No token means guest checkout
  if (!authorization) {
    req.user = null;
    return next();
  }

  // If a token is provided, it must be valid
  await authenticateUser(req);

  next();
});

// Role-based authorization
export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(
      new AppError(
        "You do not have permission to access this resource",
        403
      )
    );
  }

  next();
};
