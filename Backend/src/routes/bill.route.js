import express from "express";

import {
  createBill,
  getBills,
  getBillById,
  updateBill,
} from "../controllers/bill.controller.js";
import { downloadBillReceipt } from "../controllers/payment.controller.js";

import { protect, blockUnverifiedOwner } from "../utils/protect.js";

const router = express.Router();

// Create bill for a property
router.post(
  "/:propertyId/units/:unitId/tenants/:tenantId",
  protect,
  blockUnverifiedOwner,
  createBill,
);

// Get all bills for a property
router.get("/:propertyId", protect, blockUnverifiedOwner, getBills);

// Get one specific bill
router.get("/:propertyId/:billId", protect, blockUnverifiedOwner, getBillById);

// Update bill
router.put("/:propertyId/:billId", protect, blockUnverifiedOwner, updateBill);

// Download/view payment receipt for a paid bill
router.get("/:propertyId/:billId/receipt", protect, blockUnverifiedOwner, downloadBillReceipt);

export default router;
