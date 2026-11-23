import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    // Owner who manages this tenancy (null until request is approved & accepted)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },

    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      default: null,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
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

    moveInDate: {
      type: Date,
      default: Date.now,
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
    moveOutRequest: {
      requestedAt: {
        type: Date,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
      requestedMoveOutDate: {
        type: Date,
        default: null,
      },
      status: {
        type: String,
        enum: ["none", "pending", "approved", "expired", "rejected"],
        default: "none",
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      rejectionReason: {
        type: String,
        trim: true,
        default: "",
      },
    },
  },
  { timestamps: true },
);

// One active tenant per unit (only when unit is assigned)
tenantSchema.index(
  { unit: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true, unit: { $type: "objectId" } },
  },
);

// Prevent duplicate active Aadhaar
tenantSchema.index(
  { aadhaarNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: "unique_active_tenant_aadhaar",
  },
);

// Only one active tenancy per email across all owners.
// Historical inactive tenancy records can share the same email.
tenantSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: "unique_active_tenant_email",
  },
);

// Prevent duplicate active phone
tenantSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: "unique_active_tenant_phone",
  },
);

// OTP login lookups
tenantSchema.index({ email: 1, isActive: 1 });
tenantSchema.index({ phone: 1, isActive: 1 });

export const Tenant = mongoose.model("Tenant", tenantSchema);
