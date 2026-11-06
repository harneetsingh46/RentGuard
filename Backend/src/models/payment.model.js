import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },

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
      min: 0.01,
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

paymentSchema.index({ tenant: 1, createdAt: -1 });

export const Payment = mongoose.model("Payment", paymentSchema);
