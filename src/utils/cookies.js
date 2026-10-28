import { env } from '../config/env.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production' || env.COOKIE_SAME_SITE === 'none',
  sameSite: env.COOKIE_SAME_SITE,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const clearRefreshCookie = (res) => {
  const options = refreshCookieOptions();
  delete options.maxAge;
  res.clearCookie(REFRESH_COOKIE_NAME, options);
};
