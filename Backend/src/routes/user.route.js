import express from "express";
import {
  getUser,
  login,
  logout,
  register,
  updateProfile,
} from "../controllers/user.controller.js";
import { protect } from "../utils/protect.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/get-user", protect, getUser);
router.put("/update-profile", protect, updateProfile);
router.post("/logout", logout);

export default router;