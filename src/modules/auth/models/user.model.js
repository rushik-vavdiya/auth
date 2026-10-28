import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['customer', 'vendor', 'admin'],
      default: 'customer',
      required: true
    },
    emailVerifiedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    passwordChangedAt: { type: Date, default: null, select: false },
    emailVerificationTokenHash: { type: String, default: null, select: false },
    emailVerificationExpiresAt: { type: Date, default: null, select: false },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false }
  },
  { timestamps: true, versionKey: false }
)

userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ emailVerificationTokenHash: 1 }, { sparse: true })
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true })

const User = mongoose.model('User', userSchema)
export default User
