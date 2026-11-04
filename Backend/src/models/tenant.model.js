import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    // Owner who created this tenancy
    owner: {
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
      trim: true,
    },

    aadhaarNumber: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
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

    tokenVersion: {
      type: Number,
      default: 0,
    },

    contactVerified: {
      type: Boolean,
      default: false,
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
  { timestamps: true }
);

// One active tenant per unit
tenantSchema.index(
  { unit: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

// Prevent duplicate active Aadhaar under the same owner
tenantSchema.index(
  { owner: 1, aadhaarNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

// Prevent duplicate active email under the same owner
tenantSchema.index(
  { owner: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

// Prevent duplicate active phone under the same owner
tenantSchema.index(
  { owner: 1, phone: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

// OTP login lookups
tenantSchema.index({ email: 1, isActive: 1 });
tenantSchema.index({ phone: 1, isActive: 1 });

export const Tenant = mongoose.model("Tenant", tenantSchema);