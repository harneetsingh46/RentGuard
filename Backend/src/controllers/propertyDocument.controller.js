import mongoose from "mongoose";

import { Property } from "../models/property.model.js";
import { PropertyDocument } from "../models/propertyDocument.model.js";
import { Tenant } from "../models/tenant.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";

const ALLOWED_DOCUMENT_TYPES = ["agreement", "ownership", "tax", "other"];

const MIME_TO_FORMAT = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const isValidObjectId = (id) =>
  typeof id === "string" &&
  /^[a-fA-F0-9]{24}$/.test(id) &&
  mongoose.Types.ObjectId.isValid(id);

const sendError = (res, error, fallbackMessage) => {
  console.error(fallbackMessage, error);

  return res.status(error.status || 500).json({
    message: error.status && error.message ? error.message : fallbackMessage,
  });
};

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Upload a document to Cloudinary and save its metadata in MongoDB.
 *
 * Owners can create property-level documents.
 * Tenants can create documents associated with their own tenancy.
 */
const uploadDocumentFile = async (req, { propertyId, tenantId = null }) => {
  const { documentName, documentType = "other" } = req.body;

  if (typeof documentName !== "string" || !documentName.trim()) {
    throw createHttpError(400, "Document name is required.");
  }

  if (documentName.trim().length > 100) {
    throw createHttpError(400, "Document name cannot exceed 100 characters.");
  }

  if (!req.file) {
    throw createHttpError(400, "Please select a document to upload.");
  }

  if (!ALLOWED_DOCUMENT_TYPES.includes(documentType)) {
    throw createHttpError(400, "Invalid document type.");
  }

  const fileFormat = MIME_TO_FORMAT[req.file.mimetype];

  if (!fileFormat) {
    throw createHttpError(
      400,
      "Only PDF, JPG, PNG, and WebP files are allowed.",
    );
  }

  const resourceType = fileFormat === "pdf" ? "raw" : "image";

  const uploadedFile = await uploadToCloudinary(req.file.buffer, {
    folder: "rentguard/property-documents",
    resourceType,
    type: "authenticated",
  });

  try {
    const document = await PropertyDocument.create({
      property: propertyId,
      tenant: tenantId,
      uploadedBy: req.user._id,
      documentName: documentName.trim(),
      documentType,
      fileUrl: uploadedFile.secure_url,
      cloudinaryPublicId: uploadedFile.public_id,
      originalFileName: req.file.originalname,
      fileFormat,
    });

    return document;
  } catch (error) {
    // Avoid leaving an orphaned Cloudinary file if MongoDB fails.
    try {
      await cloudinary.uploader.destroy(uploadedFile.public_id, {
        resource_type: resourceType,
        type: "authenticated",
        invalidate: true,
      });
    } catch (cleanupError) {
      console.error(
        "Failed to clean up the uploaded Cloudinary file:",
        cleanupError,
      );
    }

    throw error;
  }
};

/**
 * Generate a short-lived download URL.
 * The route must verify access before calling this helper.
 */
const makeDownloadUrl = (document, { attachment = true } = {}) => {
  const resourceType = document.fileFormat === "pdf" ? "raw" : "image";
  const expiresAt = Math.floor(Date.now() / 1000) + 300;

  const downloadUrl = cloudinary.utils.private_download_url(
    document.cloudinaryPublicId,
    document.fileFormat,
    {
      resource_type: resourceType,
      type: "authenticated",
      expires_at: expiresAt,
      attachment,
    },
  );

  return { downloadUrl, expiresAt };
};

/**
 * OWNER: Upload a property-level document.
 * POST /document/:propertyId
 */
export const uploadPropertyDocument = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only property owners can upload property documents.",
      });
    }

    const { propertyId } = req.params;

    if (!isValidObjectId(propertyId)) {
      return res.status(400).json({
        message: "Invalid property ID.",
      });
    }

    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found or you are not authorized.",
      });
    }

    const document = await uploadDocumentFile(req, {
      propertyId: property._id,
    });

    return res.status(201).json({
      message: "Property document uploaded successfully.",
      data: document,
    });
  } catch (error) {
    return sendError(res, error, "Failed to upload property document.");
  }
};

/**
 * OWNER: List all documents associated with an owned property.
 * Includes documents uploaded by tenants.
 * GET /document/:propertyId
 */
export const getPropertyDocuments = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only property owners can view property documents.",
      });
    }

    const { propertyId } = req.params;

    if (!isValidObjectId(propertyId)) {
      return res.status(400).json({
        message: "Invalid property ID.",
      });
    }

    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found or you are not authorized.",
      });
    }

    const documents = await PropertyDocument.find({
      property: property._id,
    })
      .populate("uploadedBy", "username email role")
      .populate("tenant", "fullName")
      .select("-fileUrl -cloudinaryPublicId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Property documents fetched successfully.",
      data: documents,
    });
  } catch (error) {
    return sendError(res, error, "Failed to fetch property documents.");
  }
};

/**
 * TENANT: Upload a document to their own active tenancy.
 * The client cannot choose the property or tenant ID.
 * POST /document/mine
 */
export const uploadMyTenantDocument = async (req, res) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can upload tenancy documents.",
      });
    }

    const tenant = await Tenant.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Active tenant profile not found.",
      });
    }

    if (!tenant.property) {
      return res.status(400).json({
        message: "Your tenant profile has no associated property.",
      });
    }

    const document = await uploadDocumentFile(req, {
      propertyId: tenant.property,
      tenantId: tenant._id,
    });

    return res.status(201).json({
      message: "Tenancy document uploaded successfully.",
      data: document,
    });
  } catch (error) {
    return sendError(res, error, "Failed to upload tenancy document.");
  }
};

/**
 * TENANT: List documents associated with their own tenancy.
 * GET /document/mine
 */
export const getMyTenantDocuments = async (req, res) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can view tenancy documents.",
      });
    }

    const tenant = await Tenant.findOne({
      user: req.user._id,
    }).populate("property", "propertyName address");

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant profile not found.",
      });
    }

    if (!tenant.property) {
      return res.status(404).json({
        message: "Your tenancy has no associated property.",
      });
    }

    const documents = await PropertyDocument.find({
      tenant: tenant._id,
      property: tenant.property._id,
    })
      .populate("uploadedBy", "username email role")
      .select("-fileUrl -cloudinaryPublicId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Your tenancy documents fetched successfully.",
      data: documents,
      property: tenant.property,
    });
  } catch (error) {
    return sendError(res, error, "Failed to fetch your tenancy documents.");
  }
};

/**
 * OWNER ONLY: Delete a document associated with an owned property.
 * DELETE /document/:propertyId/:documentId
 *
 * Tenant documents can be deleted only by the owner through this route.
 */
export const deletePropertyDocument = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only property owners can delete documents.",
      });
    }

    const { propertyId, documentId } = req.params;

    if (!isValidObjectId(propertyId) || !isValidObjectId(documentId)) {
      return res.status(400).json({
        message: "Invalid property ID or document ID.",
      });
    }

    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found or you are not authorized.",
      });
    }

    const document = await PropertyDocument.findOne({
      _id: documentId,
      property: property._id,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found.",
      });
    }

    const resourceType = document.fileFormat === "pdf" ? "raw" : "image";

    const cloudinaryResult = await cloudinary.uploader.destroy(
      document.cloudinaryPublicId,
      {
        resource_type: resourceType,
        type: "authenticated",
        invalidate: true,
      },
    );

    if (
      cloudinaryResult.result !== "ok" &&
      cloudinaryResult.result !== "not found"
    ) {
      return res.status(502).json({
        message: "Could not delete the file from Cloudinary. Please try again.",
      });
    }

    await document.deleteOne();

    return res.status(200).json({
      message: "Document deleted successfully.",
    });
  } catch (error) {
    return sendError(res, error, "Failed to delete document.");
  }
};

/**
 * OWNER: Download any document associated with an owned property.
 *
 * TENANT: Download only a document associated with their own tenancy.
 *
 * GET /document/:propertyId/:documentId/download
 */
export const getPropertyDocumentDownloadUrl = async (req, res) => {
  try {
    const { propertyId, documentId } = req.params;

    if (!isValidObjectId(propertyId) || !isValidObjectId(documentId)) {
      return res.status(400).json({
        message: "Invalid property ID or document ID.",
      });
    }

    let document;

    if (req.user.role === "owner") {
      const property = await Property.findOne({
        _id: propertyId,
        owner: req.user._id,
      });

      if (!property) {
        return res.status(404).json({
          message: "Property not found or you are not authorized.",
        });
      }

      document = await PropertyDocument.findOne({
        _id: documentId,
        property: property._id,
      });
    } else if (req.user.role === "tenant") {
      const tenant = await Tenant.findOne({
        user: req.user._id,
      });

      if (
        !tenant ||
        !tenant.property ||
        tenant.property.toString() !== propertyId
      ) {
        return res.status(403).json({
          message: "You are not authorized for this property.",
        });
      }

      document = await PropertyDocument.findOne({
        _id: documentId,
        property: tenant.property,
        tenant: tenant._id,
      });
    } else {
      return res.status(403).json({
        message: "You are not authorized to download documents.",
      });
    }

    if (!document) {
      return res.status(404).json({
        message: "Document not found.",
      });
    }

    const { downloadUrl, expiresAt } = makeDownloadUrl(document, {
      attachment: req.query.mode !== "view",
    });

    return res.status(200).json({
      message: "Secure download URL generated successfully.",
      data: {
        documentName: document.documentName,
        downloadUrl,
        expiresAt,
      },
    });
  } catch (error) {
    return sendError(res, error, "Failed to generate document download URL.");
  }
};

/**
 * TENANT: Download only documents associated with their own tenancy.
 * GET /document/mine/:documentId/download
 */
export const getMyTenantDocumentDownloadUrl = async (req, res) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can download tenancy documents.",
      });
    }

    const { documentId } = req.params;

    if (!isValidObjectId(documentId)) {
      return res.status(400).json({
        message: "Invalid document ID.",
      });
    }

    const tenant = await Tenant.findOne({
      user: req.user._id,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant profile not found.",
      });
    }

    if (!tenant.property) {
      return res.status(404).json({
        message: "Your tenancy has no associated property.",
      });
    }

    const document = await PropertyDocument.findOne({
      _id: documentId,
      tenant: tenant._id,
      property: tenant.property,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found.",
      });
    }

    const { downloadUrl, expiresAt } = makeDownloadUrl(document);

    return res.status(200).json({
      message: "Secure download URL generated successfully.",
      data: {
        documentName: document.documentName,
        downloadUrl,
        expiresAt,
      },
    });
  } catch (error) {
    return sendError(res, error, "Failed to generate document download URL.");
  }
};
