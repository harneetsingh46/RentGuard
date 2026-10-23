import express from "express"
import { protect } from "../utils/protect.js"
import { getOwnerDashboard } from "../controllers/dashboard.controller.js"

const router = express.Router()

router.get("/owner",protect,getOwnerDashboard)

export default router