import { Property } from "../models/property.model.js";
import { Unit } from "../models/unit.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Rent } from "../models/rent.model.js";

// CREATE RENT
// OWNER ONLY

export const createRent = async (req, res, next) => {
  try {
    const { propertyId, tenantId } = req.params;

    const { month, year, dueDate } = req.body;

    // Only owner can create rent
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can create rent!",
      });
    }

    // Validate month/year/due date
    if (
      month === undefined ||
      Number(month) < 1 ||
      Number(month) > 12 ||
      !year ||
      !dueDate
    ) {
      return res.status(400).json({
        message:
          "Month, year, and due date are required. Month must be between 1 and 12!",
      });
    }

    const parsedMonth = Number(month);
    const parsedYear = Number(year);
    const parsedDueDate = new Date(dueDate);

    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        message: "Invalid due date!",
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

    // Check tenant
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

    // Check tenant's unit
    const unit = await Unit.findOne({
      _id: tenant.unit,
      property: propertyId,
    });

    if (!unit) {
      return res.status(404).json({
        message: "Tenant's unit not found!",
      });
    }

    // Tenant should currently occupy the unit
    if (unit.status !== "occupied") {
      return res.status(400).json({
        message: "Tenant's unit is not currently occupied!",
      });
    }

    // Check duplicate rent
    const existingRent = await Rent.findOne({
      tenant: tenantId,
      month: parsedMonth,
      year: parsedYear,
    });

    if (existingRent) {
      return res.status(409).json({
        message: "Rent for this month already exists!",
      });
    }

    // Create rent using current unit rent
    const rent = await Rent.create({
      tenant: tenantId,
      property: propertyId,
      unit: unit._id,
      amount: unit.rent,
      paidAmount: 0,
      month: parsedMonth,
      year: parsedYear,
      dueDate: parsedDueDate,
      status: "pending",
    });

    return res.status(201).json({
      message: "Rent created successfully!",
      data: rent,
    });
  } catch (error) {
    // Handles unique-index race condition too
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Rent for this tenant and month already exists!",
      });
    }

    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET ALL RENTS FOR PROPERTY
// OWNER ONLY

export const getAllRents = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can access rents!",
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

    const rents = await Rent.find({
      property: propertyId,
    })
      .populate("tenant", "fullName address isActive")
      .populate("unit", "unitName unitType rent status")
      .sort({
        year: -1,
        month: -1,
      });

    if (rents.length === 0) {
      return res.status(404).json({
        message: "No rents found!",
      });
    }

    return res.status(200).json({
      message: "Rents fetched successfully!",
      data: rents,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET ALL RENTS FOR ONE TENANT
// OWNER ONLY

export const getRent = async (req, res, next) => {
  try {
    const { propertyId, tenantId } = req.params;

    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can access rents!",
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

    // We intentionally DO NOT require tenant to be active.
    // Owners must still be able to see historical rent after move-out.
    const tenant = await Tenant.findOne({
      _id: tenantId,
      property: propertyId,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found!",
      });
    }

    const rents = await Rent.find({
      tenant: tenantId,
      property: propertyId,
    })
      .populate("unit", "unitName unitType rent status")
      .sort({
        year: -1,
        month: -1,
      });

    if (rents.length === 0) {
      return res.status(404).json({
        message: "No rents found!",
      });
    }

    return res.status(200).json({
      message: "Tenant rents fetched successfully!",
      data: rents,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET ONE RENT
// OWNER ONLY

export const getOneRent = async (req, res, next) => {
  try {
    const { propertyId, rentId } = req.params;

    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can access rents!",
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

    const rent = await Rent.findOne({
      _id: rentId,
      property: propertyId,
    })
      .populate("tenant", "fullName address aadhaarNumber isActive")
      .populate("unit", "unitName unitType rent status");

    if (!rent) {
      return res.status(404).json({
        message: "Rent not found!",
      });
    }

    return res.status(200).json({
      message: "Rent fetched successfully!",
      data: rent,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE RENT
// OWNER ONLY

export const updateRent = async (req, res, next) => {
  try {
    const { propertyId, rentId } = req.params;

    const { dueDate } = req.body;

    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can update rent!",
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        message: "Due date is required!",
      });
    }

    const parsedDueDate = new Date(dueDate);

    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        message: "Invalid due date!",
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

    const rent = await Rent.findOne({
      _id: rentId,
      property: propertyId,
    });

    if (!rent) {
      return res.status(404).json({
        message: "Rent not found!",
      });
    }

    // Paid rent should not be changed
    if (rent.status === "paid") {
      return res.status(400).json({
        message: "Paid rent cannot be updated!",
      });
    }

    rent.dueDate = parsedDueDate;

    await rent.save();

    return res.status(200).json({
      message: "Rent updated successfully!",
      data: rent,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// TENANT: GET MY RENTS

export const getMyRents = async (req, res, next) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can access their rents!",
      });
    }

    const tenant = await Tenant.findOne({
      user: req.user._id,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant profile not found!",
      });
    }

    const rents = await Rent.find({
      tenant: tenant._id,
    })
      .populate("property", "propertyName address")
      .populate("unit", "unitName unitType rent")
      .sort({
        year: -1,
        month: -1,
      });

    if (rents.length === 0) {
      return res.status(404).json({
        message: "No rents found!",
      });
    }

    return res.status(200).json({
      message: "Your rents fetched successfully!",
      data: rents,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// TENANT: GET ONE RENT

export const getMyRent = async (req, res, next) => {
  try {
    const { rentId } = req.params;

    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can access their rent!",
      });
    }

    const tenant = await Tenant.findOne({
      user: req.user._id,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant profile not found!",
      });
    }

    const rent = await Rent.findOne({
      _id: rentId,
      tenant: tenant._id,
    })
      .populate("property", "propertyName address")
      .populate("unit", "unitName unitType rent");

    if (!rent) {
      return res.status(404).json({
        message: "Rent not found!",
      });
    }

    return res.status(200).json({
      message: "Rent fetched successfully!",
      data: rent,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};