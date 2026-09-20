import express from "express";

import { generateOtp, verifyOTP } from "../controllers/otp.controller.js";

const router = express.Router();

router.post("/tenant/send-otp", generateOtp);

router.post("/tenant/verify-otp", verifyOTP);

export default router;
