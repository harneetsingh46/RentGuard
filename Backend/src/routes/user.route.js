import express from "express";

import {
  register,
  getUser,
  updateProfile,
} from "../controllers/user.controller.js";

import { protect } from "../utils/protect.js";

const router = express.Router();

// Owner registration
router.post("/register", register);

// Protected owner routes
router.get("/get-user", protect, getUser);
router.put("/update-profile", protect, updateProfile);

export default router;
