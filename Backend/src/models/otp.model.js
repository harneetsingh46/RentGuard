import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    // Email or phone number used for login
    contact: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Hashed OTP (never store the actual OTP)
    hash: {
      type: String,
      required: true,
    },

    // Number of incorrect OTP attempts
    attempts: {
      type: Number,
      default: 0,
    },

    // OTP expiry time
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// MongoDB automatically deletes expired OTP records
otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export const Otp = mongoose.model("Otp", otpSchema);