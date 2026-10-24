import mongoose from "mongoose";

const propertyDocumentSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      enum: ["agreement", "ownership", "tax", "other"],
      default: "other",
    },
    fileUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileFormat: {
      type: String,
      enum: ["pdf", "jpg", "jpeg", "png", "webp"],
      required: true,
    },
  },
  { timestamps: true },
);

export const PropertyDocument = mongoose.model(
  "PropertyDocument",
  propertyDocumentSchema,
);