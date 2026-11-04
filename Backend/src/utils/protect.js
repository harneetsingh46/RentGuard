
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const protect = async (req, res, next) => {
  try {
    // 1. Get JWT from cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized. Please login.",
      });
    }

    // 2. Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    );

    // 3. Check token version exists
    if (decoded.tokenVersion === undefined) {
      return res.status(401).json({
        message: "Invalid session. Please login again.",
      });
    }

    // 4. Find owner in database
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    // 5. Check account status
    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive.",
      });
    }

    // 6. Check owner role
    if (user.role !== "owner") {
      return res.status(403).json({
        message: "Access denied. Owner account required.",
      });
    }

    // 7. Check token version
    if (
      user.tokenVersion === undefined ||
      decoded.tokenVersion !== user.tokenVersion
    ) {
      return res.status(401).json({
        message: "Session expired. Please login again.",
      });
    }

    // 8. Attach authenticated owner
    req.user = user;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

// Additional owner check when needed
export const isOwner = (req, res, next) => {
  if (!req.user || req.user.role !== "owner") {
    return res.status(403).json({
      message: "Access denied. Owner access required.",
    });
  }

  next();
};
