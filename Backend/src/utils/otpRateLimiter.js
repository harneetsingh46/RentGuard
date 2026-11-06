import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import { OTP_RATE_LIMIT, OTP_CONFIG } from "../config/policy.js";

// Maximum 30 OTP requests per IP per hour
export const otpIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: OTP_RATE_LIMIT.PER_IP_PER_HOUR,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many OTP requests. Please try again later.",
  },
});

// Maximum 10 OTP requests per contact per hour
export const otpContactHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: OTP_RATE_LIMIT.PER_CONTACT_PER_HOUR,
  keyGenerator: (req) => {
    const contact = req.body?.contact;

    if (typeof contact === "string" && contact.trim()) {
      return contact.trim().toLowerCase();
    }

    return `missing:${ipKeyGenerator(req.ip)}`;
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many requests for this contact. Try again later.",
  },
});

// One request per contact every 60 seconds
export const otpContactCooldownLimiter = rateLimit({
  windowMs: OTP_CONFIG.RESEND_WAIT_SECONDS * 1000,
  limit: 1,
  keyGenerator: (req) => {
    const contact = req.body?.contact;

    if (typeof contact === "string" && contact.trim()) {
      return contact.trim().toLowerCase();
    }

    return `missing:${ipKeyGenerator(req.ip)}`;
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Please wait 10 seconds before requesting another OTP.",
  },
});

// Maximum 30 OTP verification requests per IP per hour
export const otpVerifyIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: OTP_RATE_LIMIT.VERIFY_PER_IP_PER_HOUR,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many verification attempts. Please try again later.",
  },
});

// Maximum 10 owner registrations per IP per hour
export const registerIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: OTP_RATE_LIMIT.REGISTER_PER_IP_PER_HOUR,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many registration attempts. Please try again later.",
  },
});
