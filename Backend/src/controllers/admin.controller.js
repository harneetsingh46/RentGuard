import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Tenant } from "../models/tenant.model.js";
import bcrypt from "bcryptjs";
import { Admin } from "../models/admin.model.js";
import genToken from "../utils/genToken.js";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
});

// ADMIN LOGIN
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash");

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      admin.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (admin.tokenVersion === undefined || admin.tokenVersion === null) {
      admin.tokenVersion = 0;
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = genToken({
      ...admin.toObject(),
      role: "admin",
    });

    return res
      .status(200)
      .cookie("token", token, getCookieOptions())
      .json({
        message: "Admin login successful.",
        data: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: "admin",
        },
      });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      message: "Unable to login. Please try again.",
    });
  }
};

// ADMIN DASHBOARD OVERVIEW
export const getAdminOverview = async (req, res) => {
  try {
    const [
      totalOwners,
      pendingOwners,
      approvedOwners,
      rejectedOwners,
      totalTenants,
    ] = await Promise.all([
      User.countDocuments({ role: "owner" }),
      User.countDocuments({
        role: "owner",
        verificationStatus: "pending",
      }),
      User.countDocuments({
        role: "owner",
        verificationStatus: "approved",
      }),
      User.countDocuments({
        role: "owner",
        verificationStatus: "rejected",
      }),
      Tenant.countDocuments({}),
    ]);

    return res.status(200).json({
      message: "Admin overview fetched successfully.",
      data: {
        totalOwners,
        pendingOwners,
        approvedOwners,
        rejectedOwners,
        totalTenants,
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return res.status(500).json({
      message: "Unable to fetch admin overview.",
    });
  }
};

// GET ALL OWNERS
export const getAllOwners = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { role: "owner" };

    if (
      status &&
      ["pending", "approved", "rejected"].includes(status)
    ) {
      filter.verificationStatus = status;
    }

    const owners = await User.find(filter)
      .select(
        "username email phone isActive verificationStatus verificationReviewedAt verificationRejectionReason verifiedAt createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      message: "Owners fetched successfully.",
      data: owners,
    });
  } catch (error) {
    console.error("Get owners error:", error);
    return res.status(500).json({
      message: "Unable to fetch owners.",
    });
  }
};

// APPROVE OR REJECT OWNER
export const reviewOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid owner ID.",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected.",
      });
    }

    if (
      status === "rejected" &&
      (typeof reason !== "string" || !reason.trim())
    ) {
      return res.status(400).json({
        message: "Please provide a rejection reason.",
      });
    }

    const owner = await User.findOne({
      _id: id,
      role: "owner",
    });

    if (!owner) {
      return res.status(404).json({
        message: "Owner not found.",
      });
    }

    owner.verificationStatus = status;
    owner.verificationReviewedAt = new Date();
    owner.verificationReviewedBy = req.user._id;
    owner.verificationRejectionReason =
      status === "rejected" ? reason.trim() : null;

    await owner.save();

    return res.status(200).json({
      message:
        status === "approved"
          ? "Owner approved successfully."
          : "Owner rejected successfully.",
      data: {
        _id: owner._id,
        username: owner.username,
        email: owner.email,
        verificationStatus: owner.verificationStatus,
        verificationReviewedAt: owner.verificationReviewedAt,
        verificationRejectionReason:
          owner.verificationRejectionReason,
      },
    });
  } catch (error) {
    console.error("Review owner error:", error);
    return res.status(500).json({
      message: "Unable to review owner.",
    });
  }
};

// GET ALL TENANTS
export const getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({})
      .select(
        "fullName email phone isActive contactVerified createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      message: "Tenants fetched successfully.",
      data: tenants,
    });
  } catch (error) {
    console.error("Get tenants error:", error);
    return res.status(500).json({
      message: "Unable to fetch tenants.",
    });
  }
};
