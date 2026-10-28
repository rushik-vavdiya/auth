import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    familyId: { type: String, required: true, index: true },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false
    },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenHash: { type: String, default: null, select: false },
    userAgent: { type: String, default: null, maxlength: 500 },
    ipAddress: { type: String, default: null, maxlength: 100 }
  },
  { timestamps: true, versionKey: false }
)

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
sessionSchema.index({ userId: 1, familyId: 1 })

const Session = mongoose.model('Session', sessionSchema)
export default Session
