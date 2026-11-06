import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
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

    items: [
      {
        bill: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Bill",
          required: true,
        },

        amount: {
          type: Number,
          required: true,
          min: 0.01,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

orderSchema.index({ tenant: 1, createdAt: -1 });
orderSchema.index({ "items.bill": 1 });

export const Order = mongoose.model("Order", orderSchema);
