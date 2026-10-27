import express from "express";

import { protect } from "../utils/protect.js";
import upload from "../config/multer.js";

import {
  deletePropertyDocument,
  deleteTenantDocument,
  getDocumentDownloadUrlForOwner,
  getMyTenantDocumentDownloadUrl,
  getMyTenantDocuments,
  getPropertyDocumentDownloadUrl,
  getPropertyDocuments,
  getTenantDocumentsForOwner,
  uploadDocumentForTenant,
  uploadMyTenantDocument,
  uploadPropertyDocument,
} from "../controllers/propertyDocument.controller.js";

const router = express.Router();

// Mounted in app.js at: app.use("/document/", documentRouter)
// Full URLs below are therefore prefixed with /document

// IMPORTANT: keep the literal routes ("tenants", "documents", "upload", "mine")
// BEFORE the /:propertyId routes so they are not treated as a property ID.

// OWNER → TENANT documents
// The owner selects a tenant first, then works inside that tenant.
// Only owners of the tenant's property are allowed (checked in the controller).

// GET /document/tenants/:tenantId
router.get("/tenants/:tenantId", protect, getTenantDocumentsForOwner);

// POST /document/tenants/:tenantId
router.post(
  "/tenants/:tenantId",
  protect,
  upload.single("document"),
  uploadDocumentForTenant,
);

// GET /document/tenants/:tenantId/:documentId/download
router.get(
  "/tenants/:tenantId/:documentId/download",
  protect,
  getDocumentDownloadUrlForOwner,
);

// DELETE /document/tenants/:tenantId/:documentId
// Only the owner can delete. Tenants have no delete route.
router.delete(
  "/tenants/:tenantId/:documentId",
  protect,
  deleteTenantDocument,
);

// TENANT documents (the tenant is always the logged-in user)

// GET /document/documents
router.get("/documents", protect, getMyTenantDocuments);

// POST /document/upload
router.post(
  "/upload",
  protect,
  upload.single("document"),
  uploadMyTenantDocument,
);

// GET /document/documents/:documentId/download
router.get(
  "/documents/:documentId/download",
  protect,
  getMyTenantDocumentDownloadUrl,
);

// Legacy tenant routes (unchanged)

router.get("/mine", protect, getMyTenantDocuments);

router.post(
  "/mine",
  protect,
  upload.single("document"),
  uploadMyTenantDocument,
);

router.get(
  "/mine/:documentId/download",
  protect,
  getMyTenantDocumentDownloadUrl,
);

// Legacy property-level routes (unchanged)

router.post(
  "/:propertyId",
  protect,
  upload.single("document"),
  uploadPropertyDocument,
);

router.get("/:propertyId", protect, getPropertyDocuments);

router.get(
  "/:propertyId/:documentId/download",
  protect,
  getPropertyDocumentDownloadUrl,
);

router.delete("/:propertyId/:documentId", protect, deletePropertyDocument);

export default router;