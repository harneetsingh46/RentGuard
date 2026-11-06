import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    // Tenant who posted the complaint
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    // Owner who manages the property
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Property where the issue occurred
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    // Unit where tenant lives
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },

    // Short title of the complaint
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 120,
    },

    // Category of maintenance issue
    category: {
      type: String,
      required: true,
      enum: [
        "Plumbing",
        "Electrical",
        "Appliance",
        "Cleaning",
        "Structural",
        "Pest Control",
        "Noise",
        "Security",
        "Other",
      ],
      default: "Other",
    },

    // Priority level
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    // Full description of problem
    description: {
      type: String,
      required: true,
      trim: true,
      maxLength: 2000,
    },

    // Optional photo attachment
    imageUrl: {
      type: String,
      default: "",
    },

    cloudinaryPublicId: {
      type: String,
      default: "",
    },

    // Resolution status
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },

    // Owner response or notes
    ownerNotes: {
      type: String,
      default: "",
      trim: true,
      maxLength: 1000,
    },
  },
  { timestamps: true }
);

maintenanceSchema.index({ owner: 1, createdAt: -1 });
maintenanceSchema.index({ tenant: 1, createdAt: -1 });

export const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

