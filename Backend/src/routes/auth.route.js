import express from "express";

import {
  register,
  login,
  getUser,
  logout,
} from "../controllers/user.controller.js";

import { protect } from "../utils/protect.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", protect, getUser);
router.post("/logout", protect, logout);

export default router;
