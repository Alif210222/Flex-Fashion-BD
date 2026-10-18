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

  if (result.data.body) {
    req.body = result.data.body;
  }

  if (result.data.params) {
    req.validatedParams = result.data.params;
  }

  if (result.data.query) {
    req.validatedQuery = result.data.query;
  }

  next();
};

export default validate;