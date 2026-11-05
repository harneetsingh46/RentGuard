import express from "express";

import {
  createBill,
  getBills,
  getBillById,
  updateBill,
} from "../controllers/bill.controller.js";

import { protect } from "../utils/protect.js";

const router = express.Router();

// Create bill for a property
router.post(
  "/:propertyId/units/:unitId/tenants/:tenantId",
  protect,
  createBill,
);

// Get all bills for a property
router.get("/:propertyId", protect, getBills);

// Get one specific bill
router.get("/:propertyId/:billId", protect, getBillById);

// Update bill
router.put("/:propertyId/:billId", protect, updateBill);

export default router;
