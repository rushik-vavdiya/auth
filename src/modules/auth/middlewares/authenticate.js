import ApiError from '../../../utils/ApiError.js';
import { verifyAccessToken } from '../services/token.service.js';
import { findUserById } from '../repositories/user.repository.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Authentication required');

    const token = header.slice(7).trim();
    if (!token) throw new ApiError(401, 'Authentication required');

    const payload = verifyAccessToken(token);
    const user = await findUserById(payload.sub);

    if (!user || !user.isActive) throw new ApiError(401, 'Authentication required');

    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      emailVerifiedAt: user.emailVerifiedAt,
    };
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'Invalid or expired access token'));
  }
};
