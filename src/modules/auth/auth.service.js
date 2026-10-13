import jwt from "jsonwebtoken";
import User from "./auth.model.js";
import AppError from "../../utils/AppError.js";

const signAccessToken = (userId) => {
  return jwt.sign(
    { sub: userId.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      algorithm: "HS256",
    }
  );
};

const createUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  // Never take the role from the public request.
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: "customer",
  });

  return {
    user,
    accessToken: signAccessToken(user._id),
  };
};


// Log In user 
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select("+password");

  // Use the same response for an unknown email or incorrect password.
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is inactive", 403);
  }

  return {
    user,
    accessToken: signAccessToken(user._id),
  };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new AppError("User account not found or inactive", 401);
  }

  return user;
};

const updateProfile = async (userId, updates) => {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new AppError("User account not found or inactive", 404);
  }

  // Only fields permitted by updateProfileSchema are applied.
  Object.assign(user, updates);

  await user.save();

  return user;
};

export {
  createUser,
  loginUser,
  getProfile,
  updateProfile,
};