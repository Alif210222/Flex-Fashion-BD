import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.route.js";
import {
  notFound,
  errorHandler,
} from "./middlewares/error.middleware.js";
import productRoutes from "./modules/product/product.route.js";
import orderRoutes from "./modules/order/order.route.js";
import cartRoutes from "./modules/cart/cart.route.js";


const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Flex-Fashion BD API is running",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes)
app.use("api/v1/orders", orderRoutes)
app.use("/api/v1/cart", cartRoutes);

// error handlers 
app.use(notFound);
app.use(errorHandler);

export default app;