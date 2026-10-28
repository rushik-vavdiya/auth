import ApiError from '../../../utils/ApiError.js';
import { createSession, findSessionByTokenHash, rotateSessionToken, revokeSessionFamily, revokeAllUserSessions, deleteSessionById } from '../repositories/session.repository.js';
import { findUserById } from '../repositories/user.repository.js';
import { generateAccessToken, generateRefreshToken, generateTokenFamilyId, hashRefreshToken } from './token.service.js';

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export const createLoginSession = async (user, metadata = {}) => {
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + SESSION_MS);

  await createSession({
    userId: user._id,
    familyId: generateTokenFamilyId(),
    refreshTokenHash,
    expiresAt,
    userAgent: metadata.userAgent?.slice(0, 500),
    ipAddress: metadata.ipAddress?.slice(0, 100),
  });

  return { accessToken: generateAccessToken(user), refreshToken, expiresAt };
};

export const refreshLoginSession = async (rawToken, metadata = {}) => {
  const oldHash = hashRefreshToken(rawToken);
  const existing = await findSessionByTokenHash(oldHash);

  if (!existing) throw new ApiError(401, 'Invalid or expired session');

  if (existing.revokedAt) {
    if (existing.replacedByTokenHash) await revokeSessionFamily(existing.familyId);
    throw new ApiError(401, 'Invalid or expired session');
  }

  if (existing.expiresAt <= new Date()) {
    await revokeSessionFamily(existing.familyId);
    throw new ApiError(401, 'Invalid or expired session');
  }

  const user = await findUserById(existing.userId);
  if (!user || !user.isActive) {
    await revokeSessionFamily(existing.familyId);
    throw new ApiError(401, 'Invalid or expired session');
  }

  const newToken = generateRefreshToken();
  const newHash = hashRefreshToken(newToken);
  const expiresAt = new Date(Date.now() + SESSION_MS);

  // Create the successor first, then atomically consume the old token.
  // This ordering ensures a concurrent reuse-triggered family revocation can
  // also see and revoke the successor session.
  const nextSession = await createSession({
    userId: user._id,
    familyId: existing.familyId,
    refreshTokenHash: newHash,
    expiresAt,
    userAgent: metadata.userAgent?.slice(0, 500),
    ipAddress: metadata.ipAddress?.slice(0, 100),
  });

  const rotated = await rotateSessionToken({
    sessionId: existing._id,
    oldHash,
    newHash,
    expiresAt,
  });

  if (!rotated) {
    await revokeSessionFamily(existing.familyId);
    await deleteSessionById(nextSession._id);
    throw new ApiError(401, 'Invalid or expired session');
  }

  return { accessToken: generateAccessToken(user), refreshToken: newToken, expiresAt };
};

export const revokeCurrentSession = async (rawToken) => {
  if (!rawToken) return;
  const session = await findSessionByTokenHash(hashRefreshToken(rawToken));
  if (session) await revokeSessionFamily(session.familyId);
};

export const revokeUserSessions = async (userId) => revokeAllUserSessions(userId);
