import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
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
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    category: {
      type: String,
      enum: ["rent", "electricity", "water", "other"],
      required: true,
    },
    billName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "End date cannot be before start date.",
      },
    },
    dueDate: {
      type: Date,
      required: true,
    },

    // Payment tracking
    paymentStatus: {
      type: String,
      enum: ["unpaid", "reserved", "paid"],
      default: "unpaid",
    },

    reservedByOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
        
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

billSchema.pre("validate", function () {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date cannot be before start date.");
  }
});

billSchema.index(
  { tenant: 1, category: 1, month: 1, year: 1 },
  {
    unique: true,
    name: "unique_tenant_category_month_year",
  }
);

export const Bill = mongoose.model("Bill", billSchema);
