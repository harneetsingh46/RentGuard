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
      lowercase: true,
      trim: true,
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
    dueDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

export const Bill = mongoose.model("Bill", billSchema);
