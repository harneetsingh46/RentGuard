import bcrypt from "bcryptjs";
import { Property } from "../models/property.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Unit } from "../models/unit.model.js";
import { User } from "../models/user.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";

// Helper: verify the logged-in owner owns the property
const getOwnedProperty = (propertyId, ownerId) =>
  Property.findOne({ _id: propertyId, owner: ownerId });

// REGISTER TENANT
export const registerTenant = async (req, res) => {
  try {
    const { propertyId, unitId } = req.params;
    const { fullName, address, password } = req.body;

    const aadhaarNumber = req.body.aadhaarNumber?.toString().trim();
    const username = req.body.username?.trim().toLowerCase();
    const email = req.body.email?.trim().toLowerCase();

    if (
      !mongoose.isValidObjectId(propertyId) ||
      !mongoose.isValidObjectId(unitId)
    ) {
      return res.status(400).json({ message: "Invalid property or unit ID!" });
    }

    if (req.user.role !== "owner") {
      return res
        .status(403)
        .json({ message: "Only owners can register tenants!" });
    }

    if (!fullName || !address || !aadhaarNumber || !username || !email) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields!" });
    }

    // Enable after testing
    // if (!/^[2-9]\d{11}$/.test(aadhaarNumber)) {
    //   return res.status(400).json({ message: "Invalid Aadhaar number format!" });
    // }

    if (password && password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long!" });
    }

    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user._id,
    });
    if (!property) {
      return res
        .status(404)
        .json({ message: "Property not found or access denied!" });
    }

    const unit = await Unit.findOne({ _id: unitId, property: propertyId });
    if (!unit) {
      return res.status(404).json({ message: "Unit not found!" });
    }
    if (unit.status !== "available") {
      return res.status(400).json({ message: "This unit is not available!" });
    }

    // 1. Find an existing account: by Aadhaar first, then by username/email
    let user = null;

    const previousTenant = await Tenant.findOne({ aadhaarNumber }).sort({
      createdAt: -1,
    });
    if (previousTenant) {
      user = await User.findById(previousTenant.user);
    }

    if (!user) {
      const loginMatch = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (loginMatch) {
        if (loginMatch.role !== "tenant") {
          return res
            .status(409)
            .json({ message: "Username or email is already registered!" });
        }
        user = loginMatch;
      }
    }

    if (user && user.role !== "tenant") {
      return res
        .status(400)
        .json({ message: "This account is not a tenant account!" });
    }

    // 2. A returning tenant must not be active anywhere
    if (user) {
      const activeTenancy = await Tenant.findOne({
        user: user._id,
        isActive: true,
      });
      if (activeTenancy.user === req.user._id) {
        return res
          .status(400)
          .json({ message: "This tenant already has an active tenancy!" });
      }
    }

    // 3. New username/email must not belong to a different user
    const conflictFilter = { $or: [{ username }, { email }] };
    if (user) conflictFilter._id = { $ne: user._id };

    if (await User.findOne(conflictFilter)) {
      return res
        .status(409)
        .json({ message: "Username or email is already registered!" });
    }

    // 4. Create or update the User
    let isNewUser = false;

    if (!user) {
      if (!password) {
        return res
          .status(400)
          .json({ message: "Password is required for a new tenant!" });
      }

      user = await User.create({
        username,
        email,
        password: await bcrypt.hash(password, 10),
        role: "tenant",
        isActive: true,
      });
      isNewUser = true;
    } else {
      // Returning tenant: saved only after the Tenant is created
      user.username = username;
      user.email = email;
      user.isActive = true;
      if (password) user.password = await bcrypt.hash(password, 10);
    }

    // 5. Create a new Tenant record (old tenancies stay as history)
    let tenant;
    try {
      tenant = await Tenant.create({
        user: user._id,
        property: propertyId,
        unit: unitId,
        fullName,
        address,
        aadhaarNumber,
        isActive: true,
        moveOutDate: null,
      });

      if (!isNewUser) await user.save();
    } catch (err) {
      if (tenant) await Tenant.findByIdAndDelete(tenant._id);
      if (isNewUser) await User.findByIdAndDelete(user._id);
      throw err;
    }

    // 6. Occupy the unit
    unit.status = "occupied";
    await unit.save();

    return res.status(201).json({
      message: "Tenant registered successfully!",
      data: {
        tenantId: tenant._id,
        userId: user._id,
        fullName: tenant.fullName,
        property: tenant.property,
        unit: tenant.unit,
        isActive: tenant.isActive,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: error.keyPattern?.user
          ? "This tenant already has an active tenancy!"
          : "Username or email is already registered!",
      });
    }

    console.error("Register tenant error:", error);
    return res.status(500).json({
      message: "Something went wrong while registering the tenant!",
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
export const getTenantHistory = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (req.user.role !== "owner") {
      return res
        .status(403)
        .json({ message: "Only owner can access tenant history!" });
    }

    const property = await getOwnedProperty(propertyId, req.user._id);
    if (!property) {
      return res
        .status(404)
        .json({ message: "Property not found or access denied!" });
    }

    // Users who are currently active in this property (returned tenants)
    const activeUserIds = await Tenant.find({
      property: propertyId,
      isActive: true,
    }).distinct("user");

    const tenants = await Tenant.find({
      property: propertyId,
      isActive: false,
      user: { $nin: activeUserIds },
    })
      .populate("user", "username email isActive")
      .populate("unit", "unitName unitType rent status")
      .sort({ moveOutDate: -1 });

    // An empty history is not an error
    return res.status(200).json({
      message: "Tenant history fetched successfully!",
      data: tenants,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
// UPLOAD TENANT PROFILE PICTURE

export const uploadProfilePicture = async (req, res) => {
  try {
    // Only tenants can upload their profile picture
    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can upload a profile picture!",
      });
    }

    // Check whether an image was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image to upload!",
      });
    }

    // Find the logged-in tenant
    const tenant = await Tenant.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Active tenant profile not found!",
      });
    }

    // Upload the new image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "rentguard/tenant-profiles",
      resourceType: "image",
    });

    // Delete the previous image, if one exists
    if (tenant.profilePicturePublicId) {
      try {
        await cloudinary.uploader.destroy(tenant.profilePicturePublicId, {
          resource_type: "image",
        });
      } catch (error) {
        console.error("Could not delete previous profile picture:", error);
      }
    }

    // Save the new image details
    tenant.profilePicture = result.secure_url;
    tenant.profilePicturePublicId = result.public_id;

    await tenant.save();

    return res.status(200).json({
      message: "Profile picture uploaded successfully!",
      data: {
        profilePicture: tenant.profilePicture,
        profilePicturePublicId: tenant.profilePicturePublicId,
      },
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);

    return res.status(500).json({
      message: "Failed to upload profile picture!",
    });
  }
};
