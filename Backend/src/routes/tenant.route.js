import express from "express";

import {
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
} from "../controllers/tenant.controller.js";
import { uploadImage } from "../config/multer.js";
import { protect } from "../utils/protect.js";

const router = express.Router();

router.post("/:propertyId/units/:unitId/tenants", protect, registerTenant);

router.get("/:propertyId/tenants", protect, getAllTenants);

router.get("/:propertyId/tenants/history", protect, getTenantHistory);

// TENANT MOVE-OUT REQUEST
router.post("/me/move-out-request", protect, createMoveOutRequest);
router.get("/me/move-out-request", protect, getMyMoveOutRequest);

// OWNER MOVE-OUT REQUESTS
router.get(
  "/:propertyId/move-out-requests",
  protect,
  getPropertyMoveOutRequests,
);

router.patch(
  "/:propertyId/move-out-requests/:tenantId/approve",
  protect,
  approveMoveOutRequest,
);

router.get("/:propertyId/tenants/:tenantId", protect, getOneTenant);

router.put("/:propertyId/tenants/:tenantId", protect, updateTenant);

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
