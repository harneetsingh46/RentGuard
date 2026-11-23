import express from "express";
import {
  createUnit,
  deleteUnit,
  getUnit,
  getUnits,
  updateUnit,
} from "../controllers/unit.controller.js";

import { protect, isApprovedOwner, blockUnverifiedOwner } from "../utils/protect.js";
import { uploadUnitImages } from "../config/multer.js";

const router = express.Router();

router.post(
  "/:propertyId/units",
  protect,
  isApprovedOwner,
  uploadUnitImages.array("images", 5),
  createUnit,
);

router.get("/:propertyId/units", protect, blockUnverifiedOwner, getUnits);

router.get("/:propertyId/units/:unitId", protect, blockUnverifiedOwner, getUnit);

router.put(
  "/:propertyId/units/:unitId",
  protect,
  isApprovedOwner,
  uploadUnitImages.array("images", 5),
  updateUnit,
);

router.delete(
  "/:propertyId/units/:unitId",
  protect,
  isApprovedOwner,
  deleteUnit,
);

export default router;
