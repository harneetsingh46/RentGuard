import mongoose from "mongoose";

const ownerVerificationLogSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    status: {
      type: String,
      enum: ["approved", "rejected"],
      required: true,
    },

    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },

    reviewedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: true },
);

ownerVerificationLogSchema.index({
  owner: 1,
  reviewedAt: -1,
});

export const OwnerVerificationLog = mongoose.model(
  "OwnerVerificationLog",
  ownerVerificationLogSchema,
);
