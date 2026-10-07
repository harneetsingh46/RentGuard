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
} from "../controllers/tenant.controller.js";

import { protect } from "../utils/protect.js";

const router = express.Router();

router.post("/:propertyId/units/:unitId/tenants", protect, registerTenant);

router.get("/:propertyId/tenants", protect, getAllTenants);

router.get("/:propertyId/tenants/history", protect, getTenantHistory);

router.get("/:propertyId/tenants/:tenantId", protect, getOneTenant);

router.put("/:propertyId/tenants/:tenantId", protect, updateTenant);

router.patch("/:propertyId/tenants/:tenantId/move-out", protect, moveOutTenant);


router.get("/me", protect, getMyProfile);

router.post("/logout", protect, tenantLogout);

export default router;
