import mongoose from "mongoose";
import { Property } from "../models/property.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Unit } from "../models/unit.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";

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
      !fullName?.trim() ||
      !address?.trim() ||
      !aadhaarNumber ||
      !email?.trim() ||
      !phone?.trim()
    ) {
      return res.status(400).json({
        message: "Please fill in all required fields!",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedAadhaar = aadhaarNumber.toString().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email address!",
      });
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        message: "Phone number must contain 10 digits!",
      });
    }

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied!",
      });
    }

    const unit = await Unit.findOne({
      _id: unitId,
      property: propertyId,
    });

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found!",
      });
    }

    if (unit.status !== "available") {
      return res.status(400).json({
        message: "This unit is not available!",
      });
    }

    const existingTenant = await Tenant.findOne({
      owner: req.user._id,
      isActive: true,
      $or: [
        { aadhaarNumber: normalizedAadhaar },
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    });

    if (existingTenant) {
      return res.status(409).json({
        message: "This tenant already has an active tenancy!",
      });
    }

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
      moveOutDate: null,
      tokenVersion: 0,
      contactVerified: false,
    });

    unit.status = "occupied";
    await unit.save();

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
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This tenant or unit is already registered!",
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
