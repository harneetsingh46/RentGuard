import express from "express";

import {
  createRent,
  getAllRents,
  getMyRent,
  getMyRents,
  getOneRent,
  getRent,
  updateRent,
} from "../controllers/rent.controller.js";

import { protect } from "../utils/protect.js";

const router = express.Router();

router.get("/my-rents", protect, getMyRents);

router.get("/my-rents/:rentId", protect, getMyRent);

// Create rent for tenant
router.post(
  "/:propertyId/tenants/:tenantId",
  protect,
  createRent,
);

// Get all rents for property
router.get(
  "/:propertyId",
  protect,
  getAllRents,
);

// Get all rents of one tenant
router.get(
  "/:propertyId/tenants/:tenantId",
  protect,
  getRent,
);

// Get one specific rent
router.get(
  "/:propertyId/rents/:rentId",
  protect,
  getOneRent,
);

// Update rent
router.put(
  "/:propertyId/rents/:rentId",
  protect,
  updateRent,
);

export default router;