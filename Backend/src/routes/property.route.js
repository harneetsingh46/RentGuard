import express from "express";
import {
  createProperty,
  deleteProperty,
  getOne,
  getProperty,
  updateProperty,
} from "../controllers/property.controller.js";
import { protect, isApprovedOwner } from "../utils/protect.js";

const router = express.Router();

router.post("/", protect, isApprovedOwner, createProperty);
router.get("/", protect, getProperty);
router.get("/:id", protect, getOne);
router.put("/:id", protect, isApprovedOwner, updateProperty);
router.delete("/:id", protect, isApprovedOwner, deleteProperty);

export default router;
