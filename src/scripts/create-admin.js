import "dotenv/config";
import mongoose from "mongoose";
import User from "../modules/auth/auth.model.js";

const createAdmin = async () => {
  const { DATABASE_URL, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } =
    process.env;

  if (!DATABASE_URL || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Missing database or admin environment variables");
  }

  if (ADMIN_PASSWORD.length < 8 || ADMIN_PASSWORD.length > 72) {
    throw new Error("Admin password must be 8–72 characters");
  }

  await mongoose.connect(DATABASE_URL);

  try {
    const email = ADMIN_EMAIL.trim().toLowerCase();

    const existing = await User.findOne({ email });

    if (existing) {
      throw new Error(
        "This email already exists. No account was changed."
      );
    }

    await User.create({
      name: ADMIN_NAME,
      email,
      password: ADMIN_PASSWORD,
      role: "admin",
    });

    console.log("Admin account created successfully");
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});