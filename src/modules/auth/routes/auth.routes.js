import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { validateBody } from '../../../middlewares/validate.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireTrustedOrigin } from '../middlewares/requireTrustedOrigin.js'
import {
  registerSchema,
  loginSchema,
  emailSchemaBody,
  tokenSchema,
  resetPasswordSchema,
  changePasswordSchema
} from '../validators/auth.validation.js'
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
  verifyEmailController,
  resendVerificationController,
  forgotPassword,
  resetPasswordController,
  changePasswordController
} from '../controllers/auth.controller.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Try again later.'
  }
})

const recoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Try again later.' }
})

router.post('/register', authLimiter, validateBody(registerSchema), register)
router.post('/login', authLimiter, validateBody(loginSchema), login)
router.post('/refresh', authLimiter, requireTrustedOrigin, refresh)
router.post('/logout', requireTrustedOrigin, logout)
router.post('/logout-all', authenticate, logoutAll)
router.get('/me', authenticate, me)
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  changePasswordController
)
router.post(
  '/verify-email',
  recoveryLimiter,
  validateBody(tokenSchema),
  verifyEmailController
)
router.post(
  '/resend-verification',
  recoveryLimiter,
  validateBody(emailSchemaBody),
  resendVerificationController
)
router.post(
  '/forgot-password',
  recoveryLimiter,
  validateBody(emailSchemaBody),
  forgotPassword
)
router.post(
  '/reset-password',
  recoveryLimiter,
  validateBody(resetPasswordSchema),
  resetPasswordController
)

export default router
