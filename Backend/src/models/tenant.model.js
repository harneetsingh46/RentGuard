import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    aadhaarNumber: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    moveOutDate: {
      type: Date,
      default: null,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    profilePicturePublicId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// Lookups (non-unique)
tenantSchema.index({ aadhaarNumber: 1, property: 1 });

// One ACTIVE tenancy per user; moved-out records don't conflict
tenantSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { isActive: true } },
);

export const Tenant = mongoose.model("Tenant", tenantSchema);
