import { randomBytes } from 'node:crypto';
import { env } from '../../../config/env.js';
import ApiError from '../../../utils/ApiError.js';
import { hashToken } from '../../../utils/crypto.js';
import {
  createUser, findUserByEmail, findUserByEmailWithPassword, findUserById,
  findUserByIdWithPassword, findUserByVerificationHash, findUserByResetHash, saveUser,
} from '../repositories/user.repository.js';
import { revokeUserSessions } from './session.service.js';
import { hashPassword, verifyPassword } from './password.service.js';
import { sendActionEmail } from './email.service.js';

const getSafeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  emailVerifiedAt: user.emailVerifiedAt,
  createdAt: user.createdAt,
});

const createActionToken = () => randomBytes(32).toString('base64url');
const actionUrl = (path, token) => `${env.CLIENT_URL.replace(/\/$/, '')}${path}?token=${encodeURIComponent(token)}`;

export const registerUser = async (input) => {
  const existing = await findUserByEmail(input.email);
  if (existing) throw new ApiError(409, 'Unable to register with this email');

  const verificationToken = createActionToken();
  const user = await createUser({
    name: input.name,
    email: input.email,
    password: await hashPassword(input.password),
    emailVerificationTokenHash: hashToken(verificationToken),
    emailVerificationExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  await sendActionEmail({
    to: user.email,
    subject: 'Verify your email address',
    text: `Hello ${user.name},\n\nVerify your email using this link:\n${actionUrl('/verify-email', verificationToken)}\n\nThis link expires in 30 minutes.`,
  });

  return getSafeUser(user);
};

export const verifyLoginCredentials = async (input) => {
  const user = await findUserByEmailWithPassword(input.email);
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const matches = await verifyPassword(user.password, input.password);
  if (!matches || !user.isActive) throw new ApiError(401, 'Invalid email or password');
  if (!user.emailVerifiedAt) throw new ApiError(403, 'Verify your email before logging in');

  return user;
};

export const getCurrentUser = async (userId) => {
  const user = await findUserById(userId);
  if (!user || !user.isActive) throw new ApiError(401, 'User account is unavailable');
  return getSafeUser(user);
};

export const verifyEmail = async (token) => {
  const user = await findUserByVerificationHash(hashToken(token));
  if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt <= new Date()) {
    throw new ApiError(400, 'Invalid or expired verification link');
  }

  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
  await saveUser(user);
  return getSafeUser(user);
};

export const resendVerification = async (email) => {
  const user = await findUserByEmail(email);
  if (!user || user.emailVerifiedAt) return;

  const token = createActionToken();
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await saveUser(user);

  await sendActionEmail({
    to: user.email,
    subject: 'Verify your email address',
    text: `Verify your email using this link:\n${actionUrl('/verify-email', token)}\n\nThis link expires in 30 minutes.`,
  });
};

export const requestPasswordReset = async (email) => {
  const user = await findUserByEmail(email);
  if (!user || !user.isActive) return;

  const token = createActionToken();
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await saveUser(user);

  await sendActionEmail({
    to: user.email,
    subject: 'Reset your password',
    text: `Reset your password using this link:\n${actionUrl('/reset-password', token)}\n\nThis link expires in 15 minutes. If you did not request this, ignore this email.`,
  });
};

export const resetPassword = async (token, password) => {
  const user = await findUserByResetHash(hashToken(token));
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date()) {
    throw new ApiError(400, 'Invalid or expired password reset link');
  }

  user.password = await hashPassword(password);
  user.passwordChangedAt = new Date();
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await saveUser(user);
  await revokeUserSessions(user._id);
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await findUserByIdWithPassword(userId);
  if (!user || !user.isActive) throw new ApiError(401, 'User account is unavailable');

  if (!(await verifyPassword(user.password, currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await saveUser(user);
  await revokeUserSessions(user._id);
  return getSafeUser(user);
};
