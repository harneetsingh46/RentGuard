import express from "express";
import { protect, isTenant, isOwner } from "../utils/protect.js";
import {
  createRentalRequest,
  getMyRentalRequests,
  cancelMyRentalRequest,
  getOwnerRentalRequests,
  approveRentalRequest,
  rejectRentalRequest,
  acceptApprovedRentalRequest,
  declineApprovedRentalRequest,
} from "../controllers/rentalRequest.controller.js";

const router = express.Router();

// --- Tenant Routes ---
router.post("/", protect, isTenant, createRentalRequest);
router.get("/my-requests", protect, isTenant, getMyRentalRequests);
router.patch("/:id/accept", protect, isTenant, acceptApprovedRentalRequest);
router.patch("/:id/decline", protect, isTenant, declineApprovedRentalRequest);
router.delete("/:id", protect, isTenant, cancelMyRentalRequest);

// --- Owner Routes ---
router.get("/owner-requests", protect, isOwner, getOwnerRentalRequests);
router.patch("/:id/approve", protect, isOwner, approveRentalRequest);
router.patch("/:id/reject", protect, isOwner, rejectRentalRequest);

export default router;

