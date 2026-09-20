import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      required: function () {
        return this.role === "owner";
      },
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      required: function () {
        return this.role === "owner";
      },
    },

    password: {
      type: String,
      required: function () {
        return this.role === "owner";
      },
    },

    phone: {
      type: String,
      unique: true,
      trim: true,
      required: function () {
        return this.role === "tenant";
      },
    },

    role: {
      type: String,
      required: true,
      enum: ["owner", "tenant"],
      lowercase: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);
