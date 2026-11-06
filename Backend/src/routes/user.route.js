import express from "express";

import {
  register,
  getUser,
  updateProfile,
} from "../controllers/user.controller.js";

import { isOwner, protect } from "../utils/protect.js";
import { registerIpLimiter } from "../utils/otpRateLimiter.js";

const router = express.Router();

// Owner registration
router.post("/register", registerIpLimiter, register);

// Protected owner routes
router.get("/get-user", protect, getUser);
router.put("/update-profile", protect,isOwner, updateProfile);

export default router;
