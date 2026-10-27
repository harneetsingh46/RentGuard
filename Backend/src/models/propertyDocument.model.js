import mongoose from "mongoose";

const propertyDocumentSchema = new mongoose.Schema(
  {
    // Property to which the document belongs
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    // Null for property-level documents.
    // Set to a tenant ID for tenant-specific documents.
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      index: true,
    },

    // User account that uploaded the document
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Name displayed in the application
    documentName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },

    // Category of document
    documentType: {
      type: String,
      enum: ["agreement", "ownership", "tax", "other"],
      default: "other",
    },

    // Cloudinary file URL
    fileUrl: {
      type: String,
      required: true,
    },

    // Cloudinary public ID used to generate secure download URLs
    cloudinaryPublicId: {
      type: String,
      required: true,
    },

    // Original uploaded filename
    originalFileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    // File format used when downloading or deleting the file
    fileFormat: {
      type: String,
      enum: ["pdf", "jpg", "jpeg", "png", "webp"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Efficiently retrieve documents belonging to a property.
propertyDocumentSchema.index({
  property: 1,
  createdAt: -1,
});

// Efficiently retrieve documents belonging to a specific tenancy.
propertyDocumentSchema.index({
  tenant: 1,
  property: 1,
  createdAt: -1,
});

export const PropertyDocument = mongoose.model(
  "PropertyDocument",
  propertyDocumentSchema
);