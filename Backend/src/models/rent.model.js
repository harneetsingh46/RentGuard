import mongoose from "mongoose";

const rentSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
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

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    month: {
      type: Number,
      min: 1,
      max: 12,
      required: true,
    },

    year: {
      type: Number,
      required: true,
      min: 2000,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "partial", "paid", "overdue"],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
    },

    razorpayPaymentId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// One rent record per tenant per month
rentSchema.index(
  {
    tenant: 1,
    month: 1,
    year: 1,
  },
  {
    unique: true,
  },
);

export const Rent = mongoose.model("Rent", rentSchema);