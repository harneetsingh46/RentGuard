import express from "express";

import {
  requestOtp,
  verifyOtp,
  getUser,
  logout,
} from "../controllers/user.controller.js";

import {
  otpIpLimiter,
  otpContactHourlyLimiter,
  otpContactCooldownLimiter,
  otpVerifyIpLimiter,
} from "../utils/otpRateLimiter.js";

import { protect } from "../utils/protect.js";

const router = express.Router();

// Public OTP routes
router.post(
  "/request-otp",
  otpIpLimiter,
  otpContactHourlyLimiter,
  otpContactCooldownLimiter,
  requestOtp
);

router.post(
  "/verify-otp",
  otpVerifyIpLimiter,
  verifyOtp
);

// Protected owner routes
router.get("/me", protect, getUser);
router.post("/logout", protect, logout);

export default router;