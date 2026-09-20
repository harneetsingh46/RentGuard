import express from "express";
import { getUser, login, logout, register } from "../controllers/user.controller.js";
import {protect} from "../utils/protect.js";
const router = express.Router();

router.post("/", register);
router.post("/login", login);
router.get("/", protect, getUser);
router.post("/logout",logout)

export default router;
