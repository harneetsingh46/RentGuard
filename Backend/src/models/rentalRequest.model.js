import mongoose from "mongoose";

const rentalRequestSchema = new mongoose.Schema(
  {
    // Tenant who applied for the rental
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    // Owner who manages the property
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Property requested
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    // Unit requested
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },

    // Status:
    // - Pending: waiting for owner review
    // - Approved: owner approved, waiting for tenant confirmation
    // - Accepted: tenant confirmed & lease activated
    // - Rejected: owner rejected
    // - Cancelled: tenant cancelled or another lease accepted
    status: {
      type: String,
      enum: ["Pending", "Approved", "Accepted", "Rejected", "Cancelled"],
      default: "Pending",
    },

    // Proposed move-in date
    moveInDate: {
      type: Date,
      default: null,
    },

    // Optional message from applicant
    message: {
      type: String,
      trim: true,
      maxLength: 500,
      default: "",
    },

    // Optional reason if rejected
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

rentalRequestSchema.index({ tenant: 1, createdAt: -1 });
rentalRequestSchema.index({ owner: 1, status: 1 });
rentalRequestSchema.index({ unit: 1, status: 1 });

export const RentalRequest = mongoose.model("RentalRequest", rentalRequestSchema);

