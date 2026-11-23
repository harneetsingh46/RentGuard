import { Unit } from "../models/unit.model.js";
import { Property } from "../models/property.model.js";
import { Tenant } from "../models/tenant.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";

// HELPER: Extract unit images with fallback to legacy single image
export const getUnitImages = (unit) => {
  if (Array.isArray(unit?.images) && unit.images.length > 0) {
    return unit.images;
  }
  if (unit?.image?.url) {
    return [unit.image];
  }
  return [];
};

const formatUnit = (unitDoc) => {
  if (!unitDoc) return unitDoc;
  const obj = unitDoc.toObject ? unitDoc.toObject() : { ...unitDoc };
  obj.images = getUnitImages(obj);
  return obj;
};

// CREATE UNIT

export const createUnit = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { unitName, unitType, rent } = req.body;

    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({
        message: "Invalid property ID!",
      });
    }

    const normalizedUnitName = unitName.trim();

    // Only owner can create units
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owner can create a unit!",
      });
    }

    // Validate input
    if (!unitName || !unitType || rent === undefined) {
      return res.status(400).json({
        message: "Unit name, unit type, and rent are required!",
      });
    }

    // Rent must be positive
    if (!Number.isFinite(Number(rent)) || Number(rent) <= 0) {
      return res.status(400).json({
        message: "Rent must be a valid number greater than zero!",
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
        message: "You are not authorized to add a unit to this property!",
      });
    }

    // Check duplicate unit name inside property
    const existingUnit = await Unit.findOne({
      property: propertyId,
      unitName,
    });

    if (existingUnit) {
      return res.status(409).json({
        message: "Unit already exists in this property!",
      });
    }

    const files = req.files || [];
    if (files.length > 5) {
      return res.status(400).json({
        message: "You can upload a maximum of 5 images per unit!",
      });
    }

    let images = [];
    if (files.length > 0) {
      const uploadResults = await Promise.all(
        files.map((file) =>
          uploadToCloudinary(file.buffer, {
            folder: "rentguard/units",
            resourceType: "image",
          })
        )
      );

      images = uploadResults.map((img) => ({
        url: img.secure_url,
        publicId: img.public_id,
      }));
    }

    const legacyImage = images[0] || { url: "", publicId: "" };

    let unit;
    try {
      unit = await Unit.create({
        unitName: normalizedUnitName,
        unitType,
        property: propertyId,
        rent,
        status: "available",
        images,
        image: legacyImage,
      });
    } catch (createError) {
      if (images.length > 0) {
        await Promise.allSettled(
          images.map((img) => cloudinary.uploader.destroy(img.publicId))
        );
      }
      throw createError;
    }

    return res.status(201).json({
      message: "Unit created successfully!",
      data: formatUnit(unit),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET ALL UNITS

export const getUnits = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({
        message: "Invalid property ID!",
      });
    }

    // Only owner can access units
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owner can access units!",
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
        message: "You are not authorized to view these units!",
      });
    }

    const units = await Unit.find({
      property: propertyId,
    }).sort({ createdAt: -1 });

    if (units.length === 0) {
      return res.status(404).json({
        message: "No units found!",
      });
    }

    return res.status(200).json({
      message: "Units fetched successfully!",
      data: units.map(formatUnit),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET ONE UNIT

export const getUnit = async (req, res, next) => {
  try {
    const { propertyId, unitId } = req.params;

    if (
      !mongoose.isValidObjectId(propertyId) ||
      !mongoose.isValidObjectId(unitId)
    ) {
      return res.status(400).json({
        message: "Invalid property or unit ID!",
      });
    }

    // Only owner can access unit
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owner can access unit details!",
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
        message: "You are not authorized to view this unit!",
      });
    }

    // Find unit belonging to property
    const unit = await Unit.findOne({
      _id: unitId,
      property: propertyId,
    });

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found!",
      });
    }

    return res.status(200).json({
      message: "Unit fetched successfully!",
      data: formatUnit(unit),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE UNIT

export const updateUnit = async (req, res, next) => {
  try {
    const { propertyId, unitId } = req.params;

    const { unitName, unitType, rent, status, removeImages } = req.body;

    if (
      !mongoose.isValidObjectId(propertyId) ||
      !mongoose.isValidObjectId(unitId)
    ) {
      return res.status(400).json({
        message: "Invalid property or unit ID!",
      });
    }

    // Only owner can update
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owner can update a unit!",
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
        message: "You are not authorized to update this unit!",
      });
    }

    // Find unit
    const unit = await Unit.findOne({
      _id: unitId,
      property: propertyId,
    });

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found!",
      });
    }

    // Check duplicate unit name
    if (unitName !== undefined && unitName !== unit.unitName) {
      const existingUnit = await Unit.findOne({
        property: propertyId,
        unitName,
        _id: { $ne: unitId },
      });

      if (existingUnit) {
        return res.status(409).json({
          message: "Another unit with this name already exists!",
        });
      }

      unit.unitName = unitName;
    }

    if (unitType !== undefined) {
      unit.unitType = unitType;
    }

    if (rent !== undefined) {
      if (Number(rent) <= 0) {
        return res.status(400).json({
          message: "Rent must be greater than zero!",
        });
      }

      unit.rent = rent;
    }

    if (status !== undefined) {
      unit.status = status;
    }

    // Migrate legacy image into images if images is empty and image.url exists
    if ((!unit.images || unit.images.length === 0) && unit.image?.url) {
      unit.images = [
        {
          url: unit.image.url,
          publicId: unit.image.publicId || "",
        },
      ];
    }

    // Process removeImages (JSON string array of publicIds)
    let removeList = [];
    if (removeImages) {
      try {
        removeList =
          typeof removeImages === "string"
            ? JSON.parse(removeImages)
            : removeImages;
        if (!Array.isArray(removeList)) removeList = [];
      } catch (e) {
        removeList = [];
      }
    }

    if (removeList.length > 0) {
      for (const pid of removeList) {
        if (pid) {
          try {
            await cloudinary.uploader.destroy(pid);
          } catch (error) {
            console.error("Cloudinary image deletion failed:", error.message);
          }
        }
      }

      unit.images = unit.images.filter(
        (img) => !removeList.includes(img.publicId)
      );
    }

    // Process newly uploaded req.files
    const files = req.files || [];
    let newlyUploaded = [];
    if (files.length > 0) {
      const uploadResults = await Promise.all(
        files.map((file) =>
          uploadToCloudinary(file.buffer, {
            folder: "rentguard/units",
            resourceType: "image",
          })
        )
      );

      newlyUploaded = uploadResults.map((img) => ({
        url: img.secure_url,
        publicId: img.public_id,
      }));
    }

    // Enforce final total <= 5 (destroy anything just uploaded if exceeded)
    const finalTotal = unit.images.length + newlyUploaded.length;
    if (finalTotal > 5) {
      if (newlyUploaded.length > 0) {
        await Promise.allSettled(
          newlyUploaded.map((img) => cloudinary.uploader.destroy(img.publicId))
        );
      }
      return res.status(400).json({
        message: "You can upload a maximum of 5 images per unit!",
      });
    }

    if (newlyUploaded.length > 0) {
      unit.images.push(...newlyUploaded);
    }

    unit.image = unit.images[0] || { url: "", publicId: "" };

    await unit.save();

    return res.status(200).json({
      message: "Unit updated successfully!",
      data: formatUnit(unit),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE UNIT

export const deleteUnit = async (req, res, next) => {
  try {
    const { propertyId, unitId } = req.params;

    if (
      !mongoose.isValidObjectId(propertyId) ||
      !mongoose.isValidObjectId(unitId)
    ) {
      return res.status(400).json({
        message: "Invalid property or unit ID!",
      });
    }

    // Only owner can delete
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owner can delete a unit!",
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
        message: "You are not authorized to delete this unit!",
      });
    }

    // Do not delete a unit that has an active tenant
    const activeTenant = await Tenant.findOne({ unit: unitId, isActive: true });
    if (activeTenant) {
      return res.status(400).json({
        message: "Cannot delete a unit with an active tenant!",
      });
    }

    // Find unit
    const unit = await Unit.findOne({
      _id: unitId,
      property: propertyId,
    });

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found!",
      });
    }

    // Destroy all Cloudinary assets (images plus legacy image)
    const publicIds = new Set();
    if (Array.isArray(unit.images)) {
      unit.images.forEach((img) => {
        if (img?.publicId) publicIds.add(img.publicId);
      });
    }
    if (unit.image?.publicId) {
      publicIds.add(unit.image.publicId);
    }

    if (publicIds.size > 0) {
      await Promise.allSettled(
        Array.from(publicIds).map((pid) => cloudinary.uploader.destroy(pid))
      );
    }

    await Unit.findByIdAndDelete(unitId);

    return res.status(200).json({
      message: "Unit deleted successfully!",
      data: formatUnit(unit),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};