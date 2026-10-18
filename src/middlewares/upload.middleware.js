import multer from "multer";
import AppError from "../utils/AppError.js";

const MAX_FILES = Number(process.env.PRODUCT_IMAGE_MAX_COUNT || 8);
const MAX_FILE_SIZE =
  Number(process.env.PRODUCT_IMAGE_MAX_SIZE_MB || 5) * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
    fields: 30,
    fieldSize: 100 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(
        new AppError(
          "Only JPEG, PNG, WEBP, and AVIF images are allowed",
          400
        )
      );
    }

    cb(null, true);
  },
});

export const uploadProductImages = (req, res, next) => {
  upload.array("images", MAX_FILES)(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("Each image must be within the size limit", 413));
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        return next(new AppError(`Maximum ${MAX_FILES} images allowed`, 400));
      }

      return next(new AppError(error.message, 400));
    }

    next(error);
  });
};