import express from "express";
import { protect } from "../utils/protect.js";
import upload from "../config/multer.js";
import { deletePropertyDocument, getPropertyDocuments, uploadPropertyDocument } from "../controllers/propertyDocument.controller.js";

const router = express.Router();

// Upload a document for a property
router.post(
  "/:propertyId",
  protect,
  upload.single("document"),
  uploadPropertyDocument,
);
// List documents for a property
router.get(
  "/:propertyId",
  protect,
  getPropertyDocuments,
);

// Delete a document belonging to a property
router.delete(
  "/:propertyId/:documentId",
  protect,
  deletePropertyDocument,
);

export default router;
