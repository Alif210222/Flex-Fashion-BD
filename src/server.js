import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    throw new Error("DATABASE_URL and JWT_SECRET must be configured");
  }

  await connectDB();

  app.listen(PORT, () => {
    console.log(`Flex-Fashion BD server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});