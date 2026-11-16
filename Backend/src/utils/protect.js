
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Admin } from "../models/admin.model.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized. Please login.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded.id || !decoded.role || decoded.tokenVersion === undefined) {
      return res.status(401).json({
        message: "Invalid session. Please login again.",
      });
    }

    let account;

    if (decoded.role === "owner") {
      account = await User.findById(decoded.id);
    } else if (decoded.role === "tenant") {
      account = await Tenant.findById(decoded.id);
    } else if (decoded.role === "admin") {
      account = await Admin.findById(decoded.id);
    } else {
      return res.status(403).json({
        message: "Invalid account role.",
      });
    }

    if (!account) {
      return res.status(401).json({
        message: "Account not found.",
      });
    }

    if (!account.isActive) {
      return res.status(403).json({
        message: "Your account is inactive.",
      });
    }

    if (
      account.tokenVersion === undefined ||
      decoded.tokenVersion !== account.tokenVersion
    ) {
      return res.status(401).json({
        message: "Session expired. Please login again.",
      });
    }

    req.user = account;
    req.authRole = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

// Owner-only middleware
export const isOwner = (req, res, next) => {
  if (req.authRole !== "owner") {
    return res.status(403).json({
      message: "Owner access required.",
    });
  }

  next();
};

// Tenant-only middleware
export const isTenant = (req, res, next) => {
  if (req.authRole !== "tenant") {
    return res.status(403).json({
      message: "Tenant access required.",
    });
  }

  next();
};

// Admin-only middleware
export const isAdmin = (req, res, next) => {
  if (req.authRole !== "admin") {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  next();
};

// Only approved owners can create or modify listings
export const isApprovedOwner = (req, res, next) => {
  if (req.authRole !== "owner") {
    return res.status(403).json({
      message: "Owner access required.",
    });
  }

  if (req.user.verificationStatus !== "approved") {
    return res.status(403).json({
      message:
        req.user.verificationStatus === "rejected"
          ? "Your owner verification was rejected. Please contact support."
          : "Your account is awaiting admin verification. You cannot list or modify properties yet.",
      verificationStatus: req.user.verificationStatus || "pending",
    });
  }

  next();
};
