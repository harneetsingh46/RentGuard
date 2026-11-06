import express from "express";
import { protect } from "../utils/protect.js";

import {
  createPaymentOrder,
  downloadBillReceipt,
  downloadMyPaymentReceipt,
  downloadPaymentReceipt,
  getMyPayments,
  getPropertyPayments,
  verifyPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Tenant: Create Razorpay order using RentGuard Order ID
router.post("/:orderId/order", protect, createPaymentOrder);

// Tenant: Verify payment
router.post("/verify", protect, verifyPayment);

// Tenant: Get payment history
router.get("/my-payments", protect, getMyPayments);

// Tenant: Download own payment receipt
router.get(
  "/my-payments/:paymentId/receipt",
  protect,
  downloadMyPaymentReceipt
);

// Owner: Get property payments
router.get("/property/:propertyId", protect, getPropertyPayments);

// Owner: Download payment receipt by payment ID
router.get(
  "/property/:propertyId/:paymentId/receipt",
  protect,
  downloadPaymentReceipt,
);

// Owner: Download payment receipt by bill ID
router.get(
  "/property/:propertyId/bill/:billId/receipt",
  protect,
  downloadBillReceipt,
);

export default router;
