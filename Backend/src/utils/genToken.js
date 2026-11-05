import jwt from "jsonwebtoken";
import { SESSION_CONFIG } from "../config/policy.js";

const genToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn:
        user.role === "tenant"
          ? SESSION_CONFIG.TENANT_EXPIRY
          : SESSION_CONFIG.OWNER_EXPIRY,
    },
  );
};

export default genToken;
