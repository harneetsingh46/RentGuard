import express from "express";
import { createRent, getAllRents, getMyRent, getMyRents, getOneRent, getRent, updateRent } from "../controllers/rent.controller.js";
import {protect} from "../utils/protect.js"
const router = express.Router()

router.post("/:propertyId/tenants/:tenantId",protect,createRent)
router.get("/:propertyId/",protect,getAllRents)
router.get("/:propertyId/tenants/:tenantId",protect,getRent)
router.get("/:propertyId/rents/:rentId",protect,getOneRent)
router.get("/my-rents", protect, getMyRents);
router.get("/my-rents/:rentId", protect, getMyRent);
router.put("/:propertyId/rents/:rentId",protect,updateRent)

export default router;