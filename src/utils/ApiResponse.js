export const sendSuccess = (res, statusCode, message, data = undefined) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data === undefined ? {} : { data }),
  });
};
