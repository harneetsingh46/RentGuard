import mongoose from "mongoose";
import { Property } from "../models/property.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Unit } from "../models/unit.model.js";
import { Bill } from "../models/bill.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";
import { sendTenancyNotificationEmails } from "../utils/email.js";

// HELPERS

// Verify that owner owns the property
const getOwnedProperty = (propertyId, ownerId) =>
  Property.findOne({
    _id: propertyId,
    owner: ownerId,
  });

// Mask Aadhaar number before sending API responses
const maskAadhaar = (aadhaarNumber) => {
  if (!aadhaarNumber) return "";

  const value = String(aadhaarNumber);

  return `XXXX-XXXX-${value.slice(-4)}`;
};

// Return tenant data without exposing full Aadhaar
const safeTenantData = (tenant) => {
  const data = tenant.toObject ? tenant.toObject() : { ...tenant };

  if (data.aadhaarNumber) {
    data.aadhaarNumber = maskAadhaar(data.aadhaarNumber);
  }

  return data;
};

// REGISTER TENANT

export const registerTenant = async (req, res) => {
  let claimedUnitId = null;

  await sendTenancyNotificationEmails({
    event: "registered",

    tenantEmail: tenant.email,
    tenantName: tenant.fullName,

    ownerEmail: req.user.email,
    ownerName: req.user.fullName || req.user.name || "Property Owner",

    propertyName: property.propertyName,
    propertyAddress: property.address,
    unitName: claimedUnit.unitName,
    rent: claimedUnit.rent,
  });

  try {
    const { propertyId, unitId } = req.params;
    const { fullName, address, aadhaarNumber, email, phone } = req.body;

    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can register tenants!",
      });
    }

    if (
      !mongoose.isValidObjectId(propertyId) ||
      !mongoose.isValidObjectId(unitId)
    ) {
      return res.status(400).json({
        message: "Invalid property or unit ID!",
      });
    }

    if (
      typeof fullName !== "string" ||
      typeof address !== "string" ||
      !aadhaarNumber ||
      typeof email !== "string" ||
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        message: "Please fill in all required fields!",
      });
    }

    const normalizedName = fullName.trim();
    const normalizedAddress = address.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\D/g, "");
    const normalizedAadhaar = String(aadhaarNumber).replace(/\D/g, "");

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      return res.status(400).json({
        message: "Full name must be between 2 and 100 characters!",
      });
    }

    if (normalizedAddress.length < 5 || normalizedAddress.length > 250) {
      return res.status(400).json({
        message: "Address must be between 5 and 250 characters!",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email address!",
      });
    }

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({
        message: "Phone number must be a valid 10-digit Indian mobile number!",
      });
    }

    if (!/^[2-9]\d{11}$/.test(normalizedAadhaar)) {
      return res.status(400).json({
        message: "Aadhaar number must contain 12 valid digits!",
      });
    }

    // Tenant contact details must differ from owner's contact details.
    if (
      (req.user.email &&
        normalizedEmail === String(req.user.email).trim().toLowerCase()) ||
      (req.user.phone &&
        normalizedPhone === String(req.user.phone).replace(/\D/g, ""))
    ) {
      return res.status(400).json({
        message:
          "Tenant email and phone must be different from the owner's contact details!",
      });
    }

    // Verify property ownership.
    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied!",
      });
    }

    // Check email globally and Aadhaar/phone under this owner.
    const [existingEmail, existingOwnerTenant] = await Promise.all([
      Tenant.findOne({
        email: normalizedEmail,
        isActive: true,
      }).select("_id"),

      Tenant.findOne({
        owner: req.user._id,
        isActive: true,
        $or: [{ aadhaarNumber: normalizedAadhaar }, { phone: normalizedPhone }],
      }).select("_id"),
    ]);

    if (existingEmail) {
      return res.status(409).json({
        message:
          "This email already belongs to an active tenancy. The previous tenancy must be moved out before it can be registered again.",
      });
    }

    if (existingOwnerTenant) {
      return res.status(409).json({
        message:
          "An active tenant with this Aadhaar number or phone number already exists under your account!",
      });
    }

    // Atomically claim the available unit.
    const claimedUnit = await Unit.findOneAndUpdate(
      {
        _id: unitId,
        property: propertyId,
        status: "available",
      },
      {
        $set: { status: "occupied" },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!claimedUnit) {
      const unitExists = await Unit.exists({
        _id: unitId,
        property: propertyId,
      });

      if (!unitExists) {
        return res.status(404).json({
          message: "Unit not found in the selected property!",
        });
      }

      return res.status(409).json({
        message:
          "This unit is no longer available. Please refresh the unit list.",
      });
    }

    claimedUnitId = claimedUnit._id;

    // Register immediately. No registration OTP.
    const tenant = await Tenant.create({
      owner: req.user._id,
      property: propertyId,
      unit: unitId,
      fullName: fullName.trim(),
      address: address.trim(),
      aadhaarNumber: normalizedAadhaar,
      email: normalizedEmail,
      phone: normalizedPhone,
      isActive: true,
      moveInDate: new Date(),
      moveOutDate: null,
      moveOutRequest: {
        status: "none",
        requestedAt: null,
        expiresAt: null,
        reviewedAt: null,
      },
      tokenVersion: 0,
      contactVerified: false,
    });

    // Registration succeeded. Keep unit occupied.
    claimedUnitId = null;

    return res.status(201).json({
      message: "Tenant registered successfully!",
      data: {
        tenantId: tenant._id,
        fullName: tenant.fullName,
        email: tenant.email,
        phone: tenant.phone,
        property: tenant.property,
        unit: tenant.unit,
        isActive: tenant.isActive,
      },
    });
  } catch (error) {
    // Roll back unit status if tenant creation fails.
    if (claimedUnitId) {
      try {
        await Unit.updateOne(
          {
            _id: claimedUnitId,
            status: "occupied",
          },
          {
            $set: { status: "available" },
          },
        );
      } catch (rollbackError) {
        console.error("Unit registration rollback error:", rollbackError);
      }
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      if (duplicateField === "email") {
        return res.status(409).json({
          message: "This email already belongs to an active tenancy.",
        });
      }

      if (duplicateField === "unit") {
        return res.status(409).json({
          message: "This unit is already assigned to an active tenant.",
        });
      }

      return res.status(409).json({
        message: "An active tenant with these details already exists.",
      });
    }

    console.error("Register tenant error:", error);

    return res.status(500).json({
      message: "Something went wrong while registering the tenant!",
    });
  }
};

// GET ALL ACTIVE TENANTS OF PROPERTY

export const getAllTenants = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can access tenants!",
      });
    }

    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({
        message: "Invalid property ID!",
      });
    }

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied!",
      });
    }

    const tenants = await Tenant.find({
      property: propertyId,
      owner: req.user._id,
      isActive: true,
    })
      .populate("unit", "unitName unitType rent status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Active tenants fetched successfully!",
      data: tenants.map(safeTenantData),
    });
  } catch (error) {
    console.error("Get all tenants error:", error);

    return res.status(500).json({
      message: "Unable to fetch tenants!",
    });
  }
};

// GET ONE TENANT

export const getOneTenant = async (req, res) => {
  try {
    const { tenantId, propertyId } = req.params;

    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can access tenant details!",
      });
    }

    if (
      !mongoose.isValidObjectId(propertyId) ||
      !mongoose.isValidObjectId(tenantId)
    ) {
      return res.status(400).json({
        message: "Invalid property or tenant ID!",
      });
    }

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied!",
      });
    }

    const tenant = await Tenant.findOne({
      _id: tenantId,
      property: propertyId,
      owner: req.user._id,
    }).populate("unit", "unitName unitType rent status");

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found!",
      });
    }

    return res.status(200).json({
      message: "Tenant fetched successfully!",
      data: safeTenantData(tenant),
    });
  } catch (error) {
    console.error("Get one tenant error:", error);

    return res.status(500).json({
      message: "Unable to fetch tenant!",
    });
  }
};

// UPDATE TENANT

export const updateTenant = async (req, res) => {
  try {
    const { tenantId, propertyId } = req.params;

    const { fullName, address, aadhaarNumber } = req.body;

    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can update a tenant!",
      });
    }

    if (
      !mongoose.isValidObjectId(propertyId) ||
      !mongoose.isValidObjectId(tenantId)
    ) {
      return res.status(400).json({
        message: "Invalid property or tenant ID!",
      });
    }

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied!",
      });
    }

    const tenant = await Tenant.findOne({
      _id: tenantId,
      property: propertyId,
      owner: req.user._id,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found!",
      });
    }

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || !fullName.trim()) {
        return res.status(400).json({
          message: "Full name cannot be empty!",
        });
      }

      tenant.fullName = fullName.trim();
    }

    if (address !== undefined) {
      if (typeof address !== "string" || !address.trim()) {
        return res.status(400).json({
          message: "Address cannot be empty!",
        });
      }

      tenant.address = address.trim();
    }

    if (aadhaarNumber !== undefined) {
      const normalizedAadhaar = String(aadhaarNumber).trim();

      if (!normalizedAadhaar) {
        return res.status(400).json({
          message: "Aadhaar number cannot be empty!",
        });
      }

      const existingAadhaar = await Tenant.findOne({
        owner: req.user._id,
        aadhaarNumber: normalizedAadhaar,
        isActive: true,
        _id: { $ne: tenantId },
      });

      if (existingAadhaar) {
        return res.status(409).json({
          message: "An active tenant with this Aadhaar already exists!",
        });
      }

      tenant.aadhaarNumber = normalizedAadhaar;
    }

    await tenant.save();

    return res.status(200).json({
      message: "Tenant updated successfully!",
      data: safeTenantData(tenant),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An active tenant with these details already exists!",
      });
    }

    console.error("Update tenant error:", error);

    return res.status(500).json({
      message: "Unable to update tenant!",
    });
  }
};

// GET TENANT HISTORY

export const getTenantHistory = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can access tenant history!",
      });
    }

    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({
        message: "Invalid property ID!",
      });
    }

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied!",
      });
    }

    const tenants = await Tenant.find({
      property: propertyId,
      owner: req.user._id,
      isActive: false,
    })
      .populate("unit", "unitName unitType rent status")
      .sort({ moveOutDate: -1 });

    return res.status(200).json({
      message: "Tenant history fetched successfully!",
      data: tenants.map(safeTenantData),
    });
  } catch (error) {
    console.error("Get tenant history error:", error);

    return res.status(500).json({
      message: "Unable to fetch tenant history!",
    });
  }
};

// GET MY PROFILE

export const getMyProfile = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can access this profile!",
      });
    }

    // Tenant JWT ID is the Tenant document ID
    const tenant = await Tenant.findOne({
      _id: req.user._id,
      isActive: true,
    })
      .populate("property")
      .populate("unit");

    if (!tenant) {
      return res.status(404).json({
        message: "Active tenant profile not found!",
      });
    }

    return res.status(200).json({
      message: "Tenant profile fetched successfully!",
      data: safeTenantData(tenant),
    });
  } catch (error) {
    console.error("Get tenant profile error:", error);

    return res.status(500).json({
      message: "Unable to fetch tenant profile!",
    });
  }
};

// UPDATE MY TENANT PROFILE

export const updateMyProfile = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can update their profile!",
      });
    }

    const { fullName, address } = req.body;

    if (fullName === undefined && address === undefined) {
      return res.status(400).json({
        message: "No profile details provided!",
      });
    }

    const tenant = await Tenant.findOne({
      _id: req.user._id,
      isActive: true,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Active tenant profile not found!",
      });
    }

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || !fullName.trim()) {
        return res.status(400).json({
          message: "Full name cannot be empty!",
        });
      }

      tenant.fullName = fullName.trim();
    }

    if (address !== undefined) {
      if (typeof address !== "string" || !address.trim()) {
        return res.status(400).json({
          message: "Address cannot be empty!",
        });
      }

      tenant.address = address.trim();
    }

    await tenant.save();

    return res.status(200).json({
      message: "Profile updated successfully!",
      data: safeTenantData(tenant),
    });
  } catch (error) {
    console.error("Update my profile error:", error);

    return res.status(500).json({
      message: "Unable to update profile!",
    });
  }
};

// GET TENANT DASHBOARD

export const getTenantDashboard = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can access this dashboard!",
      });
    }

    const tenant = await Tenant.findOne({
      _id: req.user._id,
      isActive: true,
    })
      .populate("property")
      .populate("unit");

    if (!tenant) {
      return res.status(404).json({
        message: "No active tenancy found!",
      });
    }

    return res.status(200).json({
      message: "Tenant dashboard fetched successfully!",
      data: {
        tenant: {
          id: tenant._id,
          fullName: tenant.fullName,
          address: tenant.address,
          email: tenant.email,
          phone: tenant.phone,
          profilePicture: tenant.profilePicture,
        },
        property: tenant.property,
        unit: tenant.unit,
        account: {
          email: tenant.email,
          phone: tenant.phone,
        },
      },
    });
  } catch (error) {
    console.error("Tenant dashboard error:", error);

    return res.status(500).json({
      message: "Failed to load tenant dashboard!",
    });
  }
};

// TENANT LOGOUT

export const tenantLogout = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can logout from this endpoint!",
      });
    }

    return res
      .clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      })
      .status(200)
      .json({
        message: "Tenant logout successful!",
      });
  } catch (error) {
    console.error("Tenant logout error:", error);

    return res.status(500).json({
      message: "Logout failed!",
    });
  }
};

// --------------------------------------------------
// MOVE OUT TENANT
// --------------------------------------------------

export const moveOutTenant = async (req, res) => {
  try {
    const { propertyId, tenantId } = req.params;

    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can move out a tenant!",
      });
    }

    if (
      !mongoose.isValidObjectId(propertyId) ||
      !mongoose.isValidObjectId(tenantId)
    ) {
      return res.status(400).json({
        message: "Invalid property or tenant ID!",
      });
    }

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied!",
      });
    }

    const tenant = await Tenant.findOne({
      _id: tenantId,
      property: propertyId,
      owner: req.user._id,
      isActive: true,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Active tenant not found!",
      });
    }

    const unit = await Unit.findOne({
      _id: tenant.unit,
      property: propertyId,
    });

    if (!unit) {
      return res.status(404).json({
        message: "Tenant's unit not found!",
      });
    }

    // End tenancy and invalidate existing tenant sessions
    tenant.isActive = false;
    tenant.moveOutDate = new Date();
    tenant.tokenVersion += 1;

    await tenant.save();

    // Make unit available
    unit.status = "available";
    await unit.save();

    return res.status(200).json({
      message: "Tenant moved out successfully!",
      data: {
        tenant: safeTenantData(tenant),
        unit,
      },
    });
  } catch (error) {
    console.error("Move out tenant error:", error);

    return res.status(500).json({
      message: "Unable to move out tenant!",
    });
  }
};

// UPLOAD TENANT PROFILE PICTURE

export const uploadProfilePicture = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can upload a profile picture!",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image to upload!",
      });
    }

    const tenant = await Tenant.findOne({
      _id: req.user._id,
      isActive: true,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Active tenant profile not found!",
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "rentguard/tenant-profiles",
      resourceType: "image",
    });

    // Delete previous image
    if (tenant.profilePicturePublicId) {
      try {
        await cloudinary.uploader.destroy(tenant.profilePicturePublicId, {
          resource_type: "image",
        });
      } catch (error) {
        console.error("Could not delete previous profile picture:", error);
      }
    }

    tenant.profilePicture = result.secure_url;
    tenant.profilePicturePublicId = result.public_id;

    await tenant.save();

    return res.status(200).json({
      message: "Profile picture uploaded successfully!",
      data: {
        profilePicture: tenant.profilePicture,
      },
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);

    return res.status(500).json({
      message: "Failed to upload profile picture!",
    });
  }
};

// TENANT: CREATE MOVE-OUT REQUEST

export const createMoveOutRequest = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can request move-out!",
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Mark an old pending request as expired after 48 hours.
    await Tenant.updateOne(
      {
        _id: req.user._id,
        isActive: true,
        "moveOutRequest.status": "pending",
        "moveOutRequest.expiresAt": { $lte: now },
      },
      {
        $set: {
          "moveOutRequest.status": "expired",
          "moveOutRequest.reviewedAt": now,
        },
      },
    );

    // Allow a new request if the previous request was:
    // none, expired, or rejected.
    const tenant = await Tenant.findOneAndUpdate(
      {
        _id: req.user._id,
        isActive: true,
        $or: [
          {
            "moveOutRequest.status": {
              $in: ["none", "expired", "rejected"],
            },
          },
          {
            "moveOutRequest.status": { $exists: false },
          },
        ],
      },
      {
        $set: {
          "moveOutRequest.requestedAt": now,
          "moveOutRequest.expiresAt": expiresAt,
          "moveOutRequest.status": "pending",
          "moveOutRequest.reviewedAt": null,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!tenant) {
      const activeTenant = await Tenant.findOne({
        _id: req.user._id,
        isActive: true,
      });

      if (!activeTenant) {
        return res.status(404).json({
          message: "Active tenancy not found!",
        });
      }

      if (activeTenant.moveOutRequest?.status === "pending") {
        return res.status(400).json({
          message: "You already have a pending move-out request.",
        });
      }

      if (activeTenant.moveOutRequest?.status === "approved") {
        return res.status(400).json({
          message: "Your move-out request has already been approved.",
        });
      }

      return res.status(400).json({
        message:
          "Unable to create a new move-out request. Please refresh and try again.",
      });
    }

    await tenant.populate([
      { path: "owner", select: "fullName name email" },
      { path: "property", select: "propertyName address" },
      { path: "unit", select: "unitName rent" },
    ]);

    await sendTenancyNotificationEmails({
      event: "requested",

      tenantEmail: tenant.email,
      tenantName: tenant.fullName,

      ownerEmail: tenant.owner?.email,
      ownerName:
        tenant.owner?.fullName || tenant.owner?.name || "Property Owner",

      propertyName: tenant.property?.propertyName,
      propertyAddress: tenant.property?.address,
      unitName: tenant.unit?.unitName,

      requestedAt: tenant.moveOutRequest.requestedAt,
      expiresAt: tenant.moveOutRequest.expiresAt,
    });

    return res.status(201).json({
      message: "Move-out request submitted successfully!",
      data: {
        status: tenant.moveOutRequest.status,
        requestedAt: tenant.moveOutRequest.requestedAt,
        expiresAt: tenant.moveOutRequest.expiresAt,
      },
    });
  } catch (error) {
    console.error("Create move-out request error:", error);

    return res.status(500).json({
      message: "Unable to submit move-out request!",
    });
  }
};

// TENANT: GET MY MOVE-OUT REQUEST

export const getMyMoveOutRequest = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can access this request!",
      });
    }

    const now = new Date();

    await Tenant.updateOne(
      {
        _id: req.user._id,
        "moveOutRequest.status": "pending",
        "moveOutRequest.expiresAt": { $lte: now },
      },
      {
        $set: {
          "moveOutRequest.status": "expired",
        },
      },
    );

    const tenant = await Tenant.findById(req.user._id).select(
      "isActive moveOutRequest moveInDate moveOutDate",
    );

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant record not found!",
      });
    }

    return res.status(200).json({
      message: "Move-out request fetched successfully!",
      data: {
        isActive: tenant.isActive,
        moveInDate: tenant.moveInDate,
        moveOutDate: tenant.moveOutDate,
        moveOutRequest: tenant.moveOutRequest,
      },
    });
  } catch (error) {
    console.error("Get move-out request error:", error);

    return res.status(500).json({
      message: "Unable to fetch move-out request!",
    });
  }
};

// OWNER: GET MOVE-OUT REQUESTS FOR A PROPERTY

export const getPropertyMoveOutRequests = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can access move-out requests!",
      });
    }

    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({
        message: "Invalid property ID!",
      });
    }

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied!",
      });
    }

    const now = new Date();

    // Expire requests that have passed their 48-hour validity.
    await Tenant.updateMany(
      {
        owner: req.user._id,
        property: propertyId,
        isActive: true,
        "moveOutRequest.status": "pending",
        "moveOutRequest.expiresAt": { $lte: now },
      },
      {
        $set: {
          "moveOutRequest.status": "expired",
        },
      },
    );

    const tenants = await Tenant.find({
      owner: req.user._id,
      property: propertyId,
      isActive: true,
      "moveOutRequest.status": "pending",
      "moveOutRequest.expiresAt": { $gt: now },
    })
      .select("fullName email phone unit moveInDate moveOutRequest")
      .populate("unit", "unitName unitType rent");

    return res.status(200).json({
      message: "Move-out requests fetched successfully!",
      data: tenants,
    });
  } catch (error) {
    console.error("Get property move-out requests error:", error);

    return res.status(500).json({
      message: "Unable to fetch move-out requests!",
    });
  }
};

// OWNER: APPROVE MOVE-OUT REQUEST

export const approveMoveOutRequest = async (req, res) => {
  let session;

  try {
    const { propertyId, tenantId } = req.params;

    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can approve move-out requests!",
      });
    }

    if (
      !mongoose.isValidObjectId(propertyId) ||
      !mongoose.isValidObjectId(tenantId)
    ) {
      return res.status(400).json({
        message: "Invalid property or tenant ID!",
      });
    }

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied!",
      });
    }

    const now = new Date();

    // Expire this request first if its validity has passed.
    await Tenant.updateOne(
      {
        _id: tenantId,
        owner: req.user._id,
        property: propertyId,
        "moveOutRequest.status": "pending",
        "moveOutRequest.expiresAt": { $lte: now },
      },
      {
        $set: {
          "moveOutRequest.status": "expired",
        },
      },
    );

    session = await mongoose.startSession();

    let approvedTenant;

    await session.withTransaction(async () => {
      const tenant = await Tenant.findOne({
        _id: tenantId,
        owner: req.user._id,
        property: propertyId,
        isActive: true,
        "moveOutRequest.status": "pending",
        "moveOutRequest.expiresAt": { $gt: now },
      }).session(session);

      if (!tenant) {
        const error = new Error(
          "Move-out request is not pending or has expired.",
        );
        error.statusCode = 400;
        throw error;
      }

      // Unpaid and reserved bills both prevent move-out approval.
      const unpaidBills = await Bill.find({
        tenant: tenant._id,
        paymentStatus: { $ne: "paid" },
      })
        .select("_id billName amount paymentStatus dueDate")
        .session(session);

      if (unpaidBills.length > 0) {
        const error = new Error(
          "Move-out request rejected because the tenant has unpaid or pending bills.",
        );

        error.code = "MOVE_OUT_UNPAID_BILLS";
        error.unpaidBills = unpaidBills;

        throw error;
      }

      const unit = await Unit.findOne({
        _id: tenant.unit,
        property: propertyId,
      }).session(session);

      if (!unit) {
        const error = new Error("Tenant's unit was not found.");
        error.statusCode = 404;
        throw error;
      }

      // End tenancy and invalidate existing tenant sessions.
      tenant.isActive = false;
      tenant.moveOutDate = new Date();
      tenant.tokenVersion += 1;

      tenant.moveOutRequest.status = "approved";
      tenant.moveOutRequest.reviewedAt = new Date();

      unit.status = "available";

      await tenant.save({ session });
      await unit.save({ session });

      approvedTenant = tenant;
    });

    await approvedTenant.populate([
      { path: "owner", select: "fullName name email" },
      { path: "property", select: "propertyName address" },
      { path: "unit", select: "unitName rent" },
    ]);

    await sendTenancyNotificationEmails({
      event: "approved",

      tenantEmail: approvedTenant.email,
      tenantName: approvedTenant.fullName,

      ownerEmail: approvedTenant.owner?.email,
      ownerName:
        approvedTenant.owner?.fullName ||
        approvedTenant.owner?.name ||
        "Property Owner",

      propertyName: approvedTenant.property?.propertyName,
      propertyAddress: approvedTenant.property?.address,
      unitName: approvedTenant.unit?.unitName,

      requestedAt: approvedTenant.moveOutRequest.requestedAt,
      reviewedAt: approvedTenant.moveOutRequest.reviewedAt,
    });

    return res.status(200).json({
      message: "Move-out request approved. Tenant has been moved out.",
      data: {
        tenant: safeTenantData(approvedTenant),
      },
    });
  } catch (error) {
    console.error("Approve move-out request error:", error);

    // Reject outside the transaction so the status change is saved.
    if (error.code === "MOVE_OUT_UNPAID_BILLS") {
      try {
        const rejection = await Tenant.updateOne(
          {
            _id: req.params.tenantId,
            owner: req.user._id,
            property: req.params.propertyId,
            isActive: true,
            "moveOutRequest.status": "pending",
          },
          {
            $set: {
              "moveOutRequest.status": "rejected",
              "moveOutRequest.reviewedAt": new Date(),
            },
          },
          { runValidators: true },
        );

        if (rejection.modifiedCount === 0) {
          return res.status(409).json({
            message: "Request is no longer pending. Please refresh.",
          });
        }

        const rejectedTenant = await Tenant.findOne({
          _id: req.params.tenantId,
          owner: req.user._id,
          property: req.params.propertyId,
        })
          .populate("owner", "fullName name email")
          .populate("property", "propertyName address")
          .populate("unit", "unitName rent");

        if (rejectedTenant) {
          await sendTenancyNotificationEmails({
            event: "rejected",

            tenantEmail: rejectedTenant.email,
            tenantName: rejectedTenant.fullName,

            ownerEmail: rejectedTenant.owner?.email,
            ownerName:
              rejectedTenant.owner?.fullName ||
              rejectedTenant.owner?.name ||
              "Property Owner",

            propertyName: rejectedTenant.property?.propertyName,
            propertyAddress: rejectedTenant.property?.address,
            unitName: rejectedTenant.unit?.unitName,

            requestedAt: rejectedTenant.moveOutRequest.requestedAt,
            reviewedAt: rejectedTenant.moveOutRequest.reviewedAt,

            bills: error.unpaidBills || [],
          });
        }

        return res.status(409).json({
          message:
            "Move-out request rejected. The tenant has unpaid or pending bills. The tenant remains active and the unit remains occupied.",
          code: "MOVE_OUT_UNPAID_BILLS",
          unpaidBills: error.unpaidBills,
        });
      } catch (rejectionError) {
        console.error("Reject move-out request error:", rejectionError);

        return res.status(500).json({
          message: "Unable to update the move-out request status.",
        });
      }
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Unable to approve move-out request!",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
