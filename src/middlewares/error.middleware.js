import AppError from "../utils/AppError.js";

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.code === 11000) {
    error = new AppError("Email is already registered", 409);
  } else if (err.name === "ValidationError") {
    error = new AppError(err.message, 400);
  } else if (err.name === "CastError") {
    error = new AppError("Invalid resource identifier", 400);
  } else if (err.type === "entity.parse.failed") {
    error = new AppError("Invalid JSON request body", 400);
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500 && process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message || "Something went wrong",
  });
};