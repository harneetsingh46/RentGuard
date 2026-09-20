import express from "express";
import { protect } from "../utils/protect.js";
import {
  createPaymentOrder,
  getMyPayments,
  getPropertyPayments,
  verifyPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/:rentId/order", protect, createPaymentOrder);
router.post("/verify", protect, verifyPayment);
router.get("/my-payments", protect, getMyPayments);
router.get("/property/:propertyId", protect, getPropertyPayments);
export default router;
