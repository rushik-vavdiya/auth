import ApiError from '../utils/ApiError.js';

export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(new ApiError(400, 'Invalid request body', result.error.flatten()));
  }
  req.validatedBody = result.data;
  next();
};
