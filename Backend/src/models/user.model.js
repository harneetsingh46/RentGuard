import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Sensitive identity fields are excluded from normal queries and API responses.
    aadhaarNumber: {
      type: String,
      required: true,
      unique: true,
      select: false,
      match: /^\d{12}$/,
    },

    panNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      select: false,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    },

    // Only owners are Users now
    role: {
      type: String,
      default: "owner",
      enum: ["owner"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    // Admin verification status for property owners
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    verificationReviewedAt: {
      type: Date,
      default: null,
    },

    verificationReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    verificationRejectionReason: {
      type: String,
      default: null,
      trim: true,
    },

    // Null until the owner verifies their first OTP
    verifiedAt: {
      type: Date,
      default: null,
    },

    // Used to invalidate existing login sessions
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
