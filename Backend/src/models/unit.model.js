
import mongoose from "mongoose";

const unitSchema = new mongoose.Schema(
  {
    unitName: {
      type: String,
      required: true,
      trim: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    unitType: {
      type: String,
      enum: ["residential", "commercial"],
      required: true,
      lowercase: true,
    },
    rent: {
      type: Number,
      required: true,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 500,
      default: "",
    },
    facilities: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    },

    // Unit images stored in Cloudinary
    images: {
      type: [
        {
          url: {
            type: String,
            default: "",
          },
          publicId: {
            type: String,
            default: "",
          },
        },
      ],
      default: [],
    },

    // Unit image stored in Cloudinary
    image: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true },
);

export const Unit = mongoose.model("Unit", unitSchema);
