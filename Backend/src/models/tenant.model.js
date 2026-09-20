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
      unique: true,
    },
    photo: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    moveOutDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export const Tenant = mongoose.model("Tenant", tenantSchema);
