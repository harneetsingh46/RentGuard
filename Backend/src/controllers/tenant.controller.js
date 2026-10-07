import bcrypt from "bcryptjs";
import { Property } from "../models/property.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Unit } from "../models/unit.model.js";
import { User } from "../models/user.model.js";

// REGISTER TENANT

export const registerTenant = async (req, res, next) => {
  try {
    const { propertyId, unitId } = req.params;

    const { fullName, address, aadhaarNumber, username, email, password } =
      req.body;

    // Validate request body
    if (
      !fullName ||
      !address ||
      !aadhaarNumber ||
      !username ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Full Name, Address, Aadhaar Number, Username, Email, and Password are required!",
      });
    }

    // Only owner can create tenant
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can create a tenant!",
      });
    }

    // Check property
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found!",
      });
    }

    // Check property ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized for this property!",
      });
    }

    // Check unit
    const unit = await Unit.findOne({
      _id: unitId,
      property: propertyId,
    });

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found!",
      });
    }

    // Unit must be available
    if (unit.status === "occupied") {
      return res.status(400).json({
        message: "Unit is already occupied!",
      });
    }

    if (unit.status === "maintenance") {
      return res.status(400).json({
        message: "Unit is under maintenance!",
      });
    }

    // Check existing active tenant in unit
    const existingTenant = await Tenant.findOne({
      unit: unitId,
      property: propertyId,
      isActive: true,
    });

    if (existingTenant) {
      return res.status(400).json({
        message: "This unit already has an active tenant!",
      });
    }

    // Check Aadhaar
    const existingAadhaar = await Tenant.findOne({
      aadhaarNumber,
      isActive: true,
    });

    if (existingAadhaar) {
      return res.status(400).json({
        message: "An active tenant with this Aadhaar already exists!",
      });
    }

    // Check username/email
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username or email is already registered!",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create tenant login account
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "tenant",
      isActive: true,
    });

    // Create tenant profile
    const tenant = await Tenant.create({
      user: user._id,
      property: propertyId,
      unit: unitId,
      fullName,
      address,
      aadhaarNumber,
      isActive: true,
      moveOutDate: null,
    });

    // Occupy unit
    unit.status = "occupied";
    await unit.save();

    return res.status(201).json({
      message: "Tenant registered successfully!",
      data: tenant,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET ALL ACTIVE TENANTS OF PROPERTY

export const getAllTenants = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    // Only owner can access
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can access tenants!",
      });
    }

    // Check property
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found!",
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized for this property!",
      });
    }

    // Get active tenants
    const tenants = await Tenant.find({
      property: propertyId,
      isActive: true,
    })
      .populate("user", "username email isActive")
      .populate("unit", "unitName unitType rent status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Active tenants fetched successfully!",
      data: tenants,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET ONE TENANT

export const getOneTenant = async (req, res, next) => {
  try {
    const { tenantId, propertyId } = req.params;

    // Only owner can access
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can access tenant details!",
      });
    }

    // Check property
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found!",
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized for this property!",
      });
    }

    // Find tenant
    const tenant = await Tenant.findOne({
      _id: tenantId,
      property: propertyId,
    })
      .populate("user", "username email isActive")
      .populate("unit", "unitName unitType rent status");

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found!",
      });
    }

    return res.status(200).json({
      message: "Tenant fetched successfully!",
      data: tenant,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE TENANT

export const updateTenant = async (req, res, next) => {
  try {
    const { tenantId, propertyId } = req.params;

    const { fullName, address, aadhaarNumber } = req.body;

    // Only owner can update
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can update a tenant!",
      });
    }

    // Check property
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found!",
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized for this property!",
      });
    }

    // Find tenant
    const tenant = await Tenant.findOne({
      _id: tenantId,
      property: propertyId,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found!",
      });
    }

    // Update tenant fields
    if (fullName !== undefined) {
      tenant.fullName = fullName;
    }

    if (address !== undefined) {
      tenant.address = address;
    }

    if (aadhaarNumber !== undefined) {
      // Check whether Aadhaar belongs to another active tenant
      const existingAadhaar = await Tenant.findOne({
        aadhaarNumber,
        isActive: true,
        _id: { $ne: tenantId },
      });

      if (existingAadhaar) {
        return res.status(400).json({
          message: "An active tenant with this Aadhaar already exists!",
        });
      }

      tenant.aadhaarNumber = aadhaarNumber;
    }

    await tenant.save();

    return res.status(200).json({
      message: "Tenant updated successfully!",
      data: tenant,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET TENANT HISTORY

export const getTenantHistory = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    // Only owner can access history
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can access tenant history!",
      });
    }

    // Check property
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found!",
      });
    }

    // Check ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized for this property!",
      });
    }

    // Get inactive tenants
    const tenants = await Tenant.find({
      property: propertyId,
      isActive: false,
    })
      .populate("user", "username email isActive")
      .populate("unit", "unitName unitType rent status")
      .sort({ moveOutDate: -1 });

    if (tenants.length === 0) {
      return res.status(404).json({
        message: "No tenant history found!",
      });
    }

    return res.status(200).json({
      message: "Tenant history fetched successfully!",
      data: tenants,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET MY PROFILE

export const getMyProfile = async (req, res, next) => {
  try {
    // Only tenant can access
    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can access this profile!",
      });
    }

    // Find tenant using logged-in user
    const tenant = await Tenant.findOne({
      user: req.user._id,
    })
      .populate("property")
      .populate("unit");

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant profile not found!",
      });
    }

    return res.status(200).json({
      message: "Tenant profile fetched successfully!",
      data: tenant,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// TENANT LOGOUT

export const tenantLogout = async (req, res, next) => {
  try {
    // Only tenant can use this endpoint
    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can logout from this endpoint!",
      });
    }

    return res.clearCookie("token").status(200).json({
      message: "Tenant logout successful!",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// MOVE OUT TENANT

export const moveOutTenant = async (req, res, next) => {
  try {
    const { propertyId, tenantId } = req.params;

    // Only owner can move out tenant
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can move out a tenant!",
      });
    }

    // Check property
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found!",
      });
    }

    // Check property ownership
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized for this property!",
      });
    }

    // Find active tenant
    const tenant = await Tenant.findOne({
      _id: tenantId,
      property: propertyId,
      isActive: true,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Active tenant not found!",
      });
    }

    // Find tenant's unit
    const unit = await Unit.findOne({
      _id: tenant.unit,
      property: propertyId,
    });

    if (!unit) {
      return res.status(404).json({
        message: "Tenant's unit not found!",
      });
    }

    // Find tenant user account
    const user = await User.findById(tenant.user);

    // Mark tenant inactive
    tenant.isActive = false;
    tenant.moveOutDate = new Date();

    await tenant.save();

    // Make unit available
    unit.status = "available";

    await unit.save();

    // Disable tenant login account
    if (user) {
      user.isActive = false;
      await user.save();
    }

    return res.status(200).json({
      message: "Tenant moved out successfully!",
      data: {
        tenant,
        unit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
