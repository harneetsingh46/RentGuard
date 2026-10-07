import { Unit } from "../models/unit.model.js";
import { Property } from "../models/property.model.js";

// CREATE UNIT

export const createUnit = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { unitName, unitType, rent } = req.body;

    // Only owner can create units
    if (req.user.role !== "owner") {
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
    if (Number(rent) <= 0) {
      return res.status(400).json({
        message: "Rent must be greater than zero!",
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

    // Create unit as available
    const unit = await Unit.create({
      unitName,
      unitType,
      property: propertyId,
      rent,
      status: "available",
    });

    return res.status(201).json({
      message: "Unit created successfully!",
      data: unit,
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

    // Only owner can access units
    if (req.user.role !== "owner") {
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
      data: units,
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

    // Only owner can access unit
    if (req.user.role !== "owner") {
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
      data: unit,
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

    const {
      unitName,
      unitType,
      rent,
      status,
    } = req.body;

    // Only owner can update
    if (req.user.role !== "owner") {
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

    await unit.save();

    return res.status(200).json({
      message: "Unit updated successfully!",
      data: unit,
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

    // Only owner can delete
    if (req.user.role !== "owner") {
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

    // Find and delete unit
    const unit = await Unit.findOneAndDelete({
      _id: unitId,
      property: propertyId,
    });

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found!",
      });
    }

    return res.status(200).json({
      message: "Unit deleted successfully!",
      data: unit,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};