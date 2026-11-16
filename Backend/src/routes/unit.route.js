import express from "express";
import { createUnit, deleteUnit, getUnit, getUnits, updateUnit } from "../controllers/unit.controller.js"
import { protect, isApprovedOwner } from "../utils/protect.js";
const router = express.Router();

router.post("/:propertyId/units", protect, isApprovedOwner, createUnit);
router.get("/:propertyId/units", protect, getUnits);
router.get("/:propertyId/units/:unitId", protect, getUnit);
router.put("/:propertyId/units/:unitId", protect, isApprovedOwner, updateUnit);
router.delete("/:propertyId/units/:unitId", protect, isApprovedOwner, deleteUnit);
export default router