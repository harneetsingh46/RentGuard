import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Tenant } from "../models/tenant.model.js";
import bcrypt from "bcryptjs";
import { Admin } from "../models/admin.model.js";
import genToken from "../utils/genToken.js";
import { OwnerVerificationLog } from "../models/ownerVerificationLog.model.js";
import { sendOwnerApprovalEmail } from "../utils/email.js";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
});

// Escape special characters before using user input in a regex
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);

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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );

    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";

    const status = req.query.status;

    const filter = {
      role: "owner",
    };

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.verificationStatus = status;
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");

      filter.$or = [
        { username: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [owners, total] = await Promise.all([
      User.find(filter)
        .select(
          "username email phone isActive verificationStatus verificationReviewedAt verificationReviewedBy verificationRejectionReason verifiedAt createdAt",
        )
        .populate("verificationReviewedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Owners fetched successfully.",
      data: owners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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

    const reviewedAt = new Date();
    const rejectionReason = status === "rejected" ? reason.trim() : null;

    // Save the latest review on the owner
    owner.verificationStatus = status;
    owner.verificationReviewedAt = reviewedAt;
    owner.verificationReviewedBy = req.user._id;
    owner.verificationRejectionReason = rejectionReason;

    await owner.save();

    // Save this review as a separate audit record
    const reviewLog = await OwnerVerificationLog.create({
      owner: owner._id,
      reviewedBy: req.user._id,
      status,
      rejectionReason,
      reviewedAt,
    });

    // Send approval confirmation to the owner
    if (status === "approved") {
      await sendOwnerApprovalEmail({
        ownerName: owner.username,
        ownerEmail: owner.email,
        approvedAt: reviewedAt,
      });
    }

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
        verificationRejectionReason: owner.verificationRejectionReason,
        reviewLogId: reviewLog._id,
      },
    });
  } catch (error) {
    console.error("Review owner error:", error);

    return res.status(500).json({
      message: "Unable to review owner.",
    });
  }
};

// GET OWNER VERIFICATION HISTORY
export const getOwnerVerificationHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid owner ID.",
      });
    }

    const owner = await User.findOne({
      _id: id,
      role: "owner",
    }).select("_id username email");

    if (!owner) {
      return res.status(404).json({
        message: "Owner not found.",
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );

    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      OwnerVerificationLog.find({ owner: id })
        .populate("reviewedBy", "name email")
        .sort({ reviewedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      OwnerVerificationLog.countDocuments({ owner: id }),
    ]);

    return res.status(200).json({
      message: "Owner verification history fetched successfully.",
      data: {
        owner,
        history,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Owner verification history error:", error);

    return res.status(500).json({
      message: "Unable to fetch owner verification history.",
    });
  }
};

// GET ALL TENANTS
export const getAllTenants = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );

    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";

    const status = req.query.status;

    const filter = {};

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");

      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [
      tenants,
      total,
      totalTenants,
      activeTenants,
      inactiveTenants,
      verifiedTenants,
    ] = await Promise.all([
      Tenant.find(filter)
        .select("fullName email phone isActive contactVerified createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Tenant.countDocuments(filter),

      Tenant.countDocuments({}),
      Tenant.countDocuments({ isActive: true }),
      Tenant.countDocuments({ isActive: false }),
      Tenant.countDocuments({ contactVerified: true }),
    ]);

    return res.status(200).json({
      message: "Tenants fetched successfully.",
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalTenants,
        activeTenants,
        inactiveTenants,
        verifiedTenants,
      },
    });
  } catch (error) {
    console.error("Get tenants error:", error);

    return res.status(500).json({
      message: "Unable to fetch tenants.",
    });
  }
};

// GET OWNER VERIFICATION DETAILS
export const getOwnerVerificationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid owner ID.",
      });
    }

    const owner = await User.findOne({
      _id: id,
      role: "owner",
    })
      .select(
        "+aadhaarNumber +panNumber username email phone isActive verificationStatus verificationReviewedAt verificationReviewedBy verificationRejectionReason verifiedAt createdAt",
      )
      .populate("verificationReviewedBy", "name email")
      .lean();

    if (!owner) {
      return res.status(404).json({
        message: "Owner not found.",
      });
    }

    return res.status(200).json({
      message: "Owner verification details fetched successfully.",
      data: owner,
    });
  } catch (error) {
    console.error("Get owner verification details error:", error);

    return res.status(500).json({
      message: "Unable to fetch owner verification details.",
    });
  }
};
