import express from "express"
import { protect } from "../utils/protect.js"
import { getMyProfile, getOneTenant, getAllTenants, moveOutTenant, registerTenant, tenantLogout, updateTenant, getTenantHistory } from "../controllers/tenant.controller.js";
const router = express.Router();

router.post("/:propertyId/units/:unitId/tenants",protect,registerTenant);
router.get("/:propertyId/tenants",protect,getAllTenants);
router.get("/:propertyId/tenants/:tenantId",protect,getOneTenant);
router.put("/:propertyId/tenants/:tenantId",protect,updateTenant);
router.get("/:propertyId/tenants/history",protect,getTenantHistory)
router.patch("/property/:propertyId/tenants/:tenantId/move-out",protect,moveOutTenant);
router.get("/me",protect,getMyProfile);
router.post("/logout",protect,tenantLogout)

export default router;