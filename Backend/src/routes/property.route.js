import express from "express"
import { createProperty, deleteProperty, getOne, getProperty, updateProperty } from "../controllers/property.controller.js"
import { protect } from "../utils/protect.js"

const router = express.Router()

router.post("/",protect,createProperty)
router.get("/",protect,getProperty)
router.get("/:id",protect,getOne)
router.put("/:id",protect,updateProperty)
router.delete("/:id",protect,deleteProperty)


export default router