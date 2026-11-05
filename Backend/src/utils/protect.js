import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Tenant } from "../models/tenant.model.js";

export const protect = async (req, res, next) => {
  try {
    // 1. Get token from cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized. Please login.",
      });
    }

    // 2. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // 3. Validate token payload
    if (!decoded.id || !decoded.role || decoded.tokenVersion === undefined) {
      return res.status(401).json({
        message: "Invalid session. Please login again.",
      });
    }

    let account;

    // 4. Find account based on role
    if (decoded.role === "owner") {
      account = await User.findById(decoded.id);
    } else if (decoded.role === "tenant") {
      account = await Tenant.findById(decoded.id);
    } else {
      return res.status(403).json({
        message: "Invalid account role.",
      });
    }

    // 5. Check account exists
    if (!account) {
      return res.status(401).json({
        message: "Account not found.",
      });
    }

    // 6. Check account status
    if (!account.isActive) {
      return res.status(403).json({
        message: "Your account is inactive.",
      });
    }

    // 7. Check token version
    if (
      account.tokenVersion === undefined ||
      decoded.tokenVersion !== account.tokenVersion
    ) {
      return res.status(401).json({
        message: "Session expired. Please login again.",
      });
    }

    // 8. Attach authenticated account
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
