import jwt from 'jsonwebtoken';
import { env } from '../../../config/env.js';
import { createOpaqueToken, hashToken, createTokenFamilyId } from '../../../utils/crypto.js';

export const generateAccessToken = (user) => jwt.sign(
  { role: user.role },
  env.JWT_ACCESS_SECRET,
  {
    subject: user._id.toString(),
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: '10m',
    algorithm: 'HS256',
  }
);

export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET, {
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
  algorithms: ['HS256'],
});

export const generateRefreshToken = () => createOpaqueToken();
export const hashRefreshToken = (token) => hashToken(token);
export const generateTokenFamilyId = () => createTokenFamilyId();
