
import express from "express";

import {
  adminLogin,
  getAdminOverview,
  getAllOwners,
  reviewOwner,
  getAllTenants,
} from "../controllers/admin.controller.js";

import { protect, isAdmin } from "../utils/protect.js";

const router = express.Router();

// Public admin login
router.post("/login", adminLogin);

// Protected admin routes
router.get("/overview", protect, isAdmin, getAdminOverview);
router.get("/owners", protect, isAdmin, getAllOwners);
router.patch("/owners/:id/review", protect, isAdmin, reviewOwner);
router.get("/tenants", protect, isAdmin, getAllTenants);

export default router;
