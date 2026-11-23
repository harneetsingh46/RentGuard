import express from "express";

import {
  registerSelfTenant,
  getAvailableProperties,
  getMyProfile,
  getOneTenant,
  getAllTenants,
  moveOutTenant,
  registerTenant,
  tenantLogout,
  updateTenant,
  getTenantHistory,
  uploadProfilePicture,
  getTenantDashboard,
  updateMyProfile,
  createMoveOutRequest,
  getMyMoveOutRequest,
  getPropertyMoveOutRequests,
  approveMoveOutRequest,
  rejectMoveOutRequest,
} from "../controllers/tenant.controller.js";
import { uploadImage } from "../config/multer.js";
import { protect, blockUnverifiedOwner } from "../utils/protect.js";

const router = express.Router();

// Public tenant registration & listings
router.post("/register-self", registerSelfTenant);
router.get("/available-listings", getAvailableProperties);

router.post("/:propertyId/units/:unitId/tenants", protect, blockUnverifiedOwner, registerTenant);

router.get("/:propertyId/tenants", protect, blockUnverifiedOwner, getAllTenants);

router.get("/:propertyId/tenants/history", protect, blockUnverifiedOwner, getTenantHistory);

// TENANT MOVE-OUT REQUEST
router.post("/me/move-out-request", protect, createMoveOutRequest);
router.get("/me/move-out-request", protect, getMyMoveOutRequest);

// OWNER MOVE-OUT REQUESTS
router.get(
  "/:propertyId/move-out-requests",
  protect,
  blockUnverifiedOwner,
  getPropertyMoveOutRequests,
);

router.patch(
  "/:propertyId/move-out-requests/:tenantId/approve",
  protect,
  blockUnverifiedOwner,
  approveMoveOutRequest,
);

router.patch(
  "/:propertyId/move-out-requests/:tenantId/reject",
  protect,
  blockUnverifiedOwner,
  rejectMoveOutRequest,
);

router.get("/:propertyId/tenants/:tenantId", protect, blockUnverifiedOwner, getOneTenant);

router.put("/:propertyId/tenants/:tenantId", protect, blockUnverifiedOwner, updateTenant);

router.get("/me", protect, getMyProfile);

router.get("/dashboard", protect, getTenantDashboard);

router.put("/me/update", protect, updateMyProfile);

router.post(
  "/me/profile-picture",
  protect,
  uploadImage.single("image"),
  uploadProfilePicture,
);

router.post("/logout", protect, tenantLogout);

export default router;
