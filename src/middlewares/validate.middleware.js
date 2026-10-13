import AppError from "../utils/AppError.js";

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => {
        const path = issue.path.join(".");
        return `${path}: ${issue.message}`;
      })
      .join(", ");

    return next(new AppError(message, 400));
  }

  next();
};

export default validate;