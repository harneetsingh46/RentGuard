import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized. Please login.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY,
    );

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found!",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive!",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};