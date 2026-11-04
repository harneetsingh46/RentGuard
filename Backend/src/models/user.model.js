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
