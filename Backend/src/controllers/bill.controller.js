import mongoose from "mongoose";
import { Bill } from "../models/bill.model.js";
import { Property } from "../models/property.model.js";
import { Unit } from "../models/unit.model.js";
import { Tenant } from "../models/tenant.model.js";

const allowedCategories = ["rent", "electricity", "water", "other"];

// Verify property belongs to the logged-in owner
const getOwnedProperty = async (propertyId, ownerId) => {
  if (!mongoose.isValidObjectId(propertyId)) {
    return null;
  }

  return Property.findOne({
    _id: propertyId,
    owner: ownerId,
  });
};

// Create Bill
export const createBill = async (req, res) => {
  try {
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can create bills.",
      });
    }

    const { propertyId, unitId, tenantId } = req.params;
    const { billName, category, amount, month, year, dueDate } = req.body;

    if (
      !Number.isInteger(Number(month)) ||
      Number(month) < 1 ||
      Number(month) > 12 ||
      !Number.isInteger(Number(year)) ||
      Number(year) < 2000 ||
      !dueDate ||
      Number.isNaN(new Date(dueDate).getTime())
    ) {
      return res.status(400).json({
        message: "Please provide a valid billing month, year and due date.",
      });
    }

    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied.",
      });
    }

    const unit = await Unit.findOne({
      _id: unitId,
      property: property._id,
    });

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found in this property.",
      });
    }

    const tenant = await Tenant.findOne({
      _id: tenantId,
      owner: req.user._id,
      property: property._id,
      unit: unit._id,
      isActive: true,
    }).populate("unit", "unitName rent")

    if (!tenant) {
      return res.status(404).json({
        message: "Active tenant not found in this unit.",
      });
    }

    if (
      !mongoose.isValidObjectId(propertyId) ||
      !mongoose.isValidObjectId(unitId) ||
      !mongoose.isValidObjectId(tenantId)
    ) {
      return res.status(400).json({
        message: "Invalid property, unit or tenant ID.",
      });
    }

    if (
      typeof billName !== "string" ||
      !billName.trim() ||
      typeof category !== "string" ||
      amount === undefined ||
      amount === null
    ) {
      return res.status(400).json({
        message: "Bill name, category and amount are required.",
      });
    }

    const normalizedCategory = category.toLowerCase().trim();

    if (!allowedCategories.includes(normalizedCategory)) {
      return res.status(400).json({
        message: "Invalid bill category.",
      });
    }

    const billAmount = Number(amount);

    if (!Number.isFinite(billAmount) || billAmount <= 0) {
      return res.status(400).json({
        message: "Please enter a valid bill amount.",
      });
    }

    const bill = await Bill.create({
      property: property._id,
      unit: unit._id,
      tenant: tenant._id,
      billName: billName.trim(),
      category: normalizedCategory,
      amount: billAmount,
      month: Number(month),
      year: Number(year),
      dueDate: new Date(dueDate),
    });

    return res.status(201).json({
      message: "Bill created successfully.",
      data: bill,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// Get all Bills for a Property
export const getBills = async (req, res) => {
  try {
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can access bills.",
      });
    }

    const { propertyId } = req.params;

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied.",
      });
    }

    const filter = {
      property: property._id,
    };

    if (req.query.unitId) {
      if (!mongoose.isValidObjectId(req.query.unitId)) {
        return res.status(400).json({
          message: "Invalid unit ID.",
        });
      }

      filter.unit = req.query.unitId;
    }

    if (req.query.tenantId) {
      if (!mongoose.isValidObjectId(req.query.tenantId)) {
        return res.status(400).json({
          message: "Invalid tenant ID.",
        });
      }

      filter.tenant = req.query.tenantId;
    }

    const bills = await Bill.find(filter)
      .populate("unit", "unitName")
      .populate("tenant", "fullName email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Bills fetched successfully.",
      data: bills,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// Get One Bill
export const getBillById = async (req, res) => {
  try {
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can access bills.",
      });
    }

    const { propertyId, billId } = req.params;

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied.",
      });
    }

    if (!mongoose.isValidObjectId(billId)) {
      return res.status(400).json({
        message: "Invalid bill ID.",
      });
    }

    const bill = await Bill.findOne({
      _id: billId,
      property: property._id,
    });

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found.",
      });
    }

    return res.status(200).json({
      message: "Bill fetched successfully.",
      data: bill,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateBill = async (req, res) => {
  try {
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can update bills.",
      });
    }

    const { propertyId, billId } = req.params;
    const { billName, category, amount, month, year, dueDate } = req.body;

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied.",
      });
    }

    if (!mongoose.isValidObjectId(billId)) {
      return res.status(400).json({
        message: "Invalid bill ID.",
      });
    }

    const bill = await Bill.findOne({
      _id: billId,
      property: property._id,
    });

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found.",
      });
    }

    // Update bill name
    if (billName !== undefined) {
      if (typeof billName !== "string" || !billName.trim()) {
        return res.status(400).json({
          message: "Bill name cannot be empty.",
        });
      }

      bill.billName = billName.trim();
    }

    // Update category
    if (category !== undefined) {
      if (typeof category !== "string") {
        return res.status(400).json({
          message: "Invalid bill category.",
        });
      }

      const normalizedCategory = category.toLowerCase().trim();

      if (!allowedCategories.includes(normalizedCategory)) {
        return res.status(400).json({
          message: "Invalid bill category.",
        });
      }

      bill.category = normalizedCategory;
    }

    // Update amount
    if (amount !== undefined) {
      const billAmount = Number(amount);

      if (!Number.isFinite(billAmount) || billAmount <= 0) {
        return res.status(400).json({
          message: "Please enter a valid bill amount.",
        });
      }

      bill.amount = billAmount;
    }

    if (month !== undefined) {
      const value = Number(month);

      if (!Number.isInteger(value) || value < 1 || value > 12) {
        return res.status(400).json({
          message: "Invalid billing month.",
        });
      }

      bill.month = value;
    }

    if (year !== undefined) {
      const value = Number(year);

      if (!Number.isInteger(value) || value < 2000) {
        return res.status(400).json({
          message: "Invalid billing year.",
        });
      }

      bill.year = value;
    }

    if (dueDate !== undefined) {
      const value = new Date(dueDate);

      if (!dueDate || Number.isNaN(value.getTime())) {
        return res.status(400).json({
          message: "Invalid due date.",
        });
      }

      bill.dueDate = value;
    }

    await bill.save();

    return res.status(200).json({
      message: "Bill updated successfully.",
      data: bill,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
