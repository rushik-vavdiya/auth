import ApiError from '../../../utils/ApiError.js';
import { sendSuccess } from '../../../utils/ApiResponse.js';
import { env } from '../../../config/env.js';
import { REFRESH_COOKIE_NAME, refreshCookieOptions, clearRefreshCookie } from '../../../utils/cookies.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import {
  registerUser, verifyLoginCredentials, getCurrentUser, verifyEmail,
  resendVerification, requestPasswordReset, resetPassword, changePassword,
} from '../services/auth.service.js';
import {
  createLoginSession, refreshLoginSession, revokeCurrentSession, revokeUserSessions,
} from '../services/session.service.js';

const sessionMetadata = (req) => ({
  userAgent: req.get('user-agent'),
  ipAddress: req.ip,
});

const setRefreshCookie = (res, token) =>
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.validatedBody);
  return sendSuccess(res, 201, 'Account created. Check your email to verify your account.', { user });
});

export const login = asyncHandler(async (req, res) => {
  const user = await verifyLoginCredentials(req.validatedBody);
  const session = await createLoginSession(user, sessionMetadata(req));
  setRefreshCookie(res, session.refreshToken);
  return sendSuccess(res, 200, 'Login successful', {
    user: {
      id: user._id.toString(), name: user.name, email: user.email, role: user.role,
      emailVerifiedAt: user.emailVerifiedAt, createdAt: user.createdAt,
    },
    accessToken: session.accessToken,
    expiresIn: 600,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE_NAME];
  if (!token) throw new ApiError(401, 'Refresh session required');

  const session = await refreshLoginSession(token, sessionMetadata(req));
  setRefreshCookie(res, session.refreshToken);
  return sendSuccess(res, 200, 'Session refreshed', {
    accessToken: session.accessToken,
    expiresIn: 600,
  });
});

export const logout = asyncHandler(async (req, res) => {
  await revokeCurrentSession(req.cookies[REFRESH_COOKIE_NAME]);
  clearRefreshCookie(res);
  return sendSuccess(res, 200, 'Logged out');
});

export const logoutAll = asyncHandler(async (req, res) => {
  await revokeUserSessions(req.user.id);
  clearRefreshCookie(res);
  return sendSuccess(res, 200, 'Logged out from all sessions');
});

export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, 'Current user', { user: await getCurrentUser(req.user.id) });
});

export const verifyEmailController = asyncHandler(async (req, res) => {
  const user = await verifyEmail(req.validatedBody.token);
  return sendSuccess(res, 200, 'Email verified successfully', { user });
});

export const resendVerificationController = asyncHandler(async (req, res) => {
  await resendVerification(req.validatedBody.email);
  return sendSuccess(res, 200, 'If the account needs verification, an email will be sent');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await requestPasswordReset(req.validatedBody.email);
  return sendSuccess(res, 200, 'If an eligible account exists, password reset instructions will be sent');
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  await resetPassword(req.validatedBody.token, req.validatedBody.password);
  clearRefreshCookie(res);
  return sendSuccess(res, 200, 'Password reset successfully. Please log in again.');
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const user = await changePassword(
    req.user.id,
    req.validatedBody.currentPassword,
    req.validatedBody.newPassword
  );
  clearRefreshCookie(res);
  return sendSuccess(res, 200, 'Password changed. Please log in again.', { user });
});
