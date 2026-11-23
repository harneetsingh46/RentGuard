import express from "express"
import { protect, blockUnverifiedOwner } from "../utils/protect.js"
import { getOwnerDashboard } from "../controllers/dashboard.controller.js"

const router = express.Router()

router.get("/owner", protect, blockUnverifiedOwner, getOwnerDashboard)

export default router