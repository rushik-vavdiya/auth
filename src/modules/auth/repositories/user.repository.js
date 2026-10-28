import User from '../models/user.model.js'

export const createUser = data => User.create(data)
export const findUserByEmail = email =>
  User.findOne({ email: email.toLowerCase().trim() })
export const findUserByEmailWithPassword = email =>
  User.findOne({ email: email.toLowerCase().trim() }).select('+password')
export const findUserById = userId => User.findById(userId)
export const findUserByIdWithPassword = userId =>
  User.findById(userId).select('+password +passwordChangedAt')
export const findUserByVerificationHash = tokenHash =>
  User.findOne({ emailVerificationTokenHash: tokenHash }).select(
    '+emailVerificationTokenHash +emailVerificationExpiresAt'
  )
export const findUserByResetHash = tokenHash =>
  User.findOne({ passwordResetTokenHash: tokenHash }).select(
    '+passwordResetTokenHash +passwordResetExpiresAt'
  )
export const updateUserById = (userId, update) =>
  User.findByIdAndUpdate(userId, update, { new: true, runValidators: true })
export const saveUser = user => user.save()
