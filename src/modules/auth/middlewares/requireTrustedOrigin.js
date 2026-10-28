import { env } from '../../../config/env.js';
import ApiError from '../../../utils/ApiError.js';

export const requireTrustedOrigin = (req, res, next) => {
  const origin = req.get('origin');

  // Non-browser clients may not send Origin. Browser requests that do send it
  // must match the configured frontend origin for cookie-authenticated actions.
  if (origin && origin !== env.CLIENT_URL) {
    return next(new ApiError(403, 'Untrusted request origin'));
  }

  next();
};
