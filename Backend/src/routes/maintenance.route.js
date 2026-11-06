import express from "express";
import { protect, isTenant, isOwner } from "../utils/protect.js";
import { uploadImage } from "../config/multer.js";
import {
  createComplaint,
  getTenantComplaints,
  getOwnerComplaints,
  getComplaintById,
  updateComplaintStatus,
} from "../controllers/maintenance.controller.js";

const router = express.Router();

// --- Tenant Routes ---
// Submit a new maintenance complaint (supports optional image)
router.post(
  "/complaint",
  protect,
  isTenant,
  uploadImage.single("image"),
  createComplaint
);

// View all complaints submitted by the logged-in tenant
router.get("/my-complaints", protect, isTenant, getTenantComplaints);

// --- Owner Routes ---
// View all complaints across properties owned by the logged-in owner
router.get("/owner-complaints", protect, isOwner, getOwnerComplaints);

// Update status and remarks for a complaint
router.patch("/complaint/:id/status", protect, isOwner, updateComplaintStatus);

// --- Shared Route ---
// View specific complaint details
router.get("/complaint/:id", protect, getComplaintById);

export default router;

