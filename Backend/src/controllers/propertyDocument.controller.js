import { Property } from "../models/property.model.js";
import { PropertyDocument } from "../models/propertyDocument.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

// UPLOAD PROPERTY DOCUMENT

export const uploadPropertyDocument = async (req, res) => {
  let cloudinaryPublicId;

  try {
    // Only owners can upload property documents
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only property owners can upload documents!",
      });
    }

    const { propertyId } = req.params;
    const { documentName, documentType } = req.body;

    // Validate required fields
    if (!documentName || !documentName.trim()) {
      return res.status(400).json({
        message: "Document name is required!",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select a document to upload!",
      });
    }

    // Verify that the property exists and belongs to this owner
    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found or you are not authorized!",
      });
    }

    // Validate document type
    const allowedDocumentTypes = ["agreement", "ownership", "tax", "other"];

    const selectedType = documentType || "other";

    if (!allowedDocumentTypes.includes(selectedType)) {
      return res.status(400).json({
        message: "Invalid document type!",
      });
    }

    // Determine file format
    const mimeToFormat = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const fileFormat = mimeToFormat[req.file.mimetype];

    if (!fileFormat) {
      return res.status(400).json({
        message: "Only PDF, JPG, PNG, and WEBP files are allowed!",
      });
    }

    // Upload file to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "rentguard/property-documents",
      resourceType: fileFormat === "pdf" ? "raw" : "image",
      type: "authenticated",
    });

    cloudinaryPublicId = result.public_id;

    // Save document details in MongoDB
    const document = await PropertyDocument.create({
      property: property._id,
      uploadedBy: req.user._id,
      documentName: documentName.trim(),
      documentType: selectedType,
      fileUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      originalFileName: req.file.originalname,
      fileFormat,
    });

    return res.status(201).json({
      message: "Property document uploaded successfully!",
      data: document,
    });
  } catch (error) {
    // If the upload worked but saving to MongoDB failed,
    // remove the orphaned file from Cloudinary.
    if (cloudinaryPublicId) {
      try {
        const { default: cloudinary } = await import("../config/cloudinary.js");

        const fileFormat =
          req.file?.mimetype === "application/pdf" ? "raw" : "image";

        await cloudinary.uploader.destroy(cloudinaryPublicId, {
          resource_type: fileFormat,
        });
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError);
      }
    }

    console.error("Property document upload error:", error);

    return res.status(500).json({
      message: "Failed to upload property document!",
    });
  }
};

// GET PROPERTY DOCUMENTS

export const getPropertyDocuments = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only property owners can view documents!",
      });
    }

    const { propertyId } = req.params;

    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found or you are not authorized!",
      });
    }

    const documents = await PropertyDocument.find({
      property: propertyId,
      uploadedBy: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Property documents fetched successfully!",
      data: documents,
    });
  } catch (error) {
    console.error("Get property documents error:", error);

    return res.status(500).json({
      message: "Failed to fetch property documents!",
    });
  }
};

// DELETE PROPERTY DOCUMENT

export const deletePropertyDocument = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only property owners can delete documents!",
      });
    }

    const { propertyId, documentId } = req.params;

    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found or you are not authorized!",
      });
    }

    const document = await PropertyDocument.findOne({
      _id: documentId,
      property: propertyId,
      uploadedBy: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found!",
      });
    }

    // Delete the file from Cloudinary
    const cloudinary = (await import("../config/cloudinary.js")).default;

    const resourceType = document.fileFormat === "pdf" ? "raw" : "image";

    const result = await cloudinary.uploader.destroy(
      document.cloudinaryPublicId,
      { resource_type: resourceType },
    );

    if (result.result !== "ok" && result.result !== "not found") {
      return res.status(502).json({
        message: "Could not delete the file from Cloudinary. Please try again.",
      });
    }

    await document.deleteOne();

    return res.status(200).json({
      message: "Property document deleted successfully!",
    });
  } catch (error) {
    console.error("Delete property document error:", error);

    return res.status(500).json({
      message: "Failed to delete property document!",
    });
  }
};
