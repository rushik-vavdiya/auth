import Session from '../models/session.model.js';

export const createSession = (data) => Session.create(data);

export const findSessionByTokenHash = (hash) =>
  Session.findOne({ refreshTokenHash: hash })
    .select('+refreshTokenHash +replacedByTokenHash');

export const rotateSessionToken = async ({ sessionId, oldHash, newHash, expiresAt }) =>
  Session.findOneAndUpdate(
    { _id: sessionId, refreshTokenHash: oldHash, revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { revokedAt: new Date(), replacedByTokenHash: newHash } },
    { new: true }
  );

export const revokeSessionFamily = (familyId) =>
  Session.updateMany({ familyId, revokedAt: null }, { $set: { revokedAt: new Date() } });

export const revokeAllUserSessions = (userId) =>
  Session.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });

export const deleteSessionById = (sessionId) => Session.findByIdAndDelete(sessionId);
