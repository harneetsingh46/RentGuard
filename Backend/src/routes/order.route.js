import express from "express";

import {
  getMyUnpaidBills,
  createOrder,
  getMyOrders,
} from "../controllers/order.controller.js";

import { protect } from "../utils/protect.js";

const router = express.Router();

// Get tenant's unpaid bills
router.get("/unpaid-bills", protect, getMyUnpaidBills);

// Create combined order
router.post("/create", protect, createOrder);

// Get tenant's order history
router.get("/my-orders", protect, getMyOrders);

export default router;
