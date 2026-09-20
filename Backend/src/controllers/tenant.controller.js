import { Property } from "../models/property.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Unit } from "../models/unit.model.js";
import { User } from "../models/user.model.js";
export const registerTenant = async (req, res, next) => {
  try {
    const { propertyId, unitId } = req.params;

    const { fullName, address, aadhaarNumber, photo, phoneNumber } = req.body;

    if (!fullName || !address || !aadhaarNumber || !photo || !phoneNumber) {
      return res.status(400).json({
        message:
          "Full Name, Address, Aadhaar Number, Photo, and Phone Number are required!",
      });
    }

    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can create a tenant!",
      });
    }

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found!",
      });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized for this property!",
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

    const existingAadhaar = await Tenant.findOne({
      aadhaarNumber,
      isActive: true,
    });

    if (existingAadhaar) {
      return res.status(400).json({
        message: "An active tenant with this Aadhaar already exists!",
      });
    }

    const existingUser = await User.findOne({
      phone: phoneNumber,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Phone number is already registered!",
      });
    }

    const user = await User.create({
      phone: phoneNumber,
      role: "tenant",
      isActive: true,
    });

    const tenant = await Tenant.create({
      user: user._id,
      property: propertyId,
      unit: unitId,
      fullName,
      address,
      aadhaarNumber,
      photo,
      isActive: true,
      moveOutDate: null,
    });

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

export const getAllTenants = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "You cannot access this !",
      });
    }
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(400).json({
        message: "No Property Found !",
      });
    }
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        message: "You are not authorized for this property !",
      });
    }
    const tenants = await Tenant.find({
      property: propertyId,
      isActive: true,
    })
      .populate("user", "phone isActive")
      .populate("unit", "unitName unitType rent status")
      .sort({ createdAt: -1 });

    if (!tenants) {
      return res.status(400).json({
        message: "No Active Tenants Found !",
      });
    }
    return res.status(200).json({
      message: "Active Tenants Fetched Successfully !",
      data: tenants,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getOneTenant = async (req, res, next) => {
  try {
    const { tenantId, propertyId } = req.params;
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "You cannot access this !",
      });
    }
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(400).json({
        message: "No Property Found !",
      });
    }
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        message: "You are not authorized for this property !",
      });
    }
    const tenant = await Tenant.findOne({ _id: tenantId, property: propertyId })
      .populate("user", "phone isActive")
      .populate("unit", "unitName unitType rent status");
    if (!tenant) {
      return res.status(400).json({
        message: "No Tenants Found !",
      });
    }
    return res.status(200).json({
      message: "Tenant Fetched Successfully !",
      data: tenant,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateTenant = async (req, res, next) => {
  try {
    const { tenantId, propertyId } = req.params;
    const { fullName, address, aadhaarNumber, photo, phone } = req.body;
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "You cannot access this !",
      });
    }
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(400).json({
        message: "No Property Found !",
      });
    }
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        message: "You are not authorized for this property !",
      });
    }
    const tenant = await Tenant.findOne({
      _id: tenantId,
      property: propertyId,
    });
    if (!tenant) {
      return res.status(400).json({
        message: "No Tenants Found !",
      });
    }
    if (fullName) {
      tenant.fullName = fullName;
    }
    if (address) {
      tenant.address = address;
    }
    if (aadhaarNumber) {
      tenant.aadhaarNumber = aadhaarNumber;
    }
    if (phone !== undefined) {
      const user = await User.findById(tenant.user._id);

      if (!user) {
        return res.status(404).json({
          message: "User not found !",
        });
      }
      user.phone = phone;
      await user.save();
    }
    if (photo) {
      tenant.photo = photo;
    }
    await tenant.save();
    return res.status(200).json({
      message: "Tenant Updated Successfully !",
      data: tenant,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getTenantHistory = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can access tenant history!",
      });
    }

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found!",
      });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized for this property!",
      });
    }

    const tenants = await Tenant.find({
      property: propertyId,
      isActive: false,
    })
      .populate("user", "phone isActive")
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

export const getMyProfile = async (req, res, next) => {
  try {
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

    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can access this profile!",
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

export const tenantLogout = async (req, res, next) => {
  try {
    return res.clearCookie("token").status(200).json({
      message: "Tenant Logout Succesfull !",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const moveOutTenant = async (req, res, next) => {
  try {
    const { propertyId, tenantId } = req.params;

    // Only owner can move out a tenant
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

    // Find tenant
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

    // Soft delete / move out
    tenant.isActive = false;
    tenant.moveOutDate = new Date();

    await tenant.save();

    // Make unit available again
    unit.status = "available";

    await unit.save();

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
