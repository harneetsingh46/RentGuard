import express from "express";

import { protect } from "../utils/protect.js";
import upload from "../config/multer.js";

import {
  deletePropertyDocument,
  getMyTenantDocumentDownloadUrl,
  getMyTenantDocuments,
  getPropertyDocumentDownloadUrl,
  getPropertyDocuments,
  uploadMyTenantDocument,
  uploadPropertyDocument,
} from "../controllers/propertyDocument.controller.js";

const router = express.Router();

// Tenant document routes
// Keep these BEFORE /:propertyId routes so "mine" is treated as a
// literal route segment rather than a property ID.

router.get(
  "/mine",
  protect,
  getMyTenantDocuments
);

router.post(
  "/mine",
  protect,
  upload.single("document"),
  uploadMyTenantDocument
);

router.get(
  "/mine/:documentId/download",
  protect,
  getMyTenantDocumentDownloadUrl
);

// Property document routes
// Owners can manage documents for properties they own.

router.post(
  "/:propertyId",
  protect,
  upload.single("document"),
  uploadPropertyDocument
);

router.get(
  "/:propertyId",
  protect,
  getPropertyDocuments
);

router.get(
  "/:propertyId/:documentId/download",
  protect,
  getPropertyDocumentDownloadUrl
);

router.delete(
  "/:propertyId/:documentId",
  protect,
  deletePropertyDocument
);

export default router;