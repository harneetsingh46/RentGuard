import express from "express";
import { submitContactForm } from "../controllers/contact.controller.js";

const router = express.Router();

// Basic per-IP limit: 5 submissions every 15 minutes.
const submissions = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS = 5;

const contactRateLimit = (req, res, next) => {
  const now = Date.now();
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  // Remove expired entries.
  for (const [key, record] of submissions.entries()) {
    if (now - record.start >= WINDOW_MS) {
      submissions.delete(key);
    }
  }

  const record = submissions.get(ip);

  if (!record || now - record.start >= WINDOW_MS) {
    submissions.set(ip, { start: now, count: 1 });
    return next();
  }

  if (record.count >= MAX_SUBMISSIONS) {
    return res.status(429).json({
      message: "Too many messages. Please try again later.",
    });
  }

  record.count += 1;
  return next();
};

router.post("/", contactRateLimit, submitContactForm);

export default router;