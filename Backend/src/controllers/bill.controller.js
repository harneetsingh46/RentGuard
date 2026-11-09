import mongoose from "mongoose";
import { Bill } from "../models/bill.model.js";
import { Property } from "../models/property.model.js";
import { Unit } from "../models/unit.model.js";
import { Tenant } from "../models/tenant.model.js";

const allowedCategories = ["rent", "electricity", "water", "other"];

const isValidDate = (value) => {
  return value && !Number.isNaN(new Date(value).getTime());
};

const getOwnedProperty = async (propertyId, ownerId) => {
  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return null;
  }

  return Property.findOne({
    _id: propertyId,
    owner: ownerId,
  });
};

const tenantDetails = "fullName email phone";

const populateBill = (query) => {
  return query
    .populate("unit", "unitName rent")
    .populate("tenant", tenantDetails);
};

// Validate bill period dates
const validateBillDates = (startDate, endDate) => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return "Valid bill start date and end date are required.";
  }

  if (new Date(endDate) < new Date(startDate)) {
    return "End date cannot be before start date.";
  }

  return null;
};

// CREATE BILL
export const createBill = async (req, res) => {
  try {
    if (req.authRole !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only owners can create bills.",
      });
    }

    const { propertyId, unitId, tenantId } = req.params;
    const {
      category,
      billName,
      amount,
      month,
      year,
      startDate,
      endDate,
      dueDate,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(unitId) ||
      !mongoose.Types.ObjectId.isValid(tenantId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid unit or tenant ID.",
      });
    }

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const unit = await Unit.findOne({
      _id: unitId,
      property: property._id,
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit not found in this property.",
      });
    }

    const tenant = await Tenant.findOne({
      _id: tenantId,
      owner: req.user._id,
      property: property._id,
      unit: unit._id,
      isActive: true,
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Active tenant not found for this unit.",
      });
    }

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bill category.",
      });
    }

    if (!billName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Bill name is required.",
      });
    }

    const billAmount = Number(amount);

    if (!Number.isFinite(billAmount) || billAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid bill amount.",
      });
    }

    const billMonth = Number(month);
    const billYear = Number(year);

    if (
      !Number.isInteger(billMonth) ||
      billMonth < 1 ||
      billMonth > 12 ||
      !Number.isInteger(billYear) ||
      billYear < 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid bill month and year.",
      });
    }

    const dateError = validateBillDates(startDate, endDate);

    if (dateError) {
      return res.status(400).json({
        success: false,
        message: dateError,
      });
    }

    if (!isValidDate(dueDate)) {
      return res.status(400).json({
        success: false,
        message: "A valid due date is required.",
      });
    }

    // Prevent duplicate bills for the same tenant, category and month.
    const existingBill = await Bill.findOne({
      tenant: tenant._id,
      category,
      month: billMonth,
      year: billYear,
    }).select("_id");

    if (existingBill) {
      return res.status(409).json({
        success: false,
        message: `A ${category} bill already exists for this tenant for ${billMonth}/${billYear}.`,
      });
    }

    const bill = await Bill.create({
      property: property._id,
      unit: unit._id,
      tenant: tenant._id,
      category,
      billName: billName.trim(),
      amount: billAmount,
      month: billMonth,
      year: billYear,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      dueDate: new Date(dueDate),
    });

    const populatedBill = await populateBill(Bill.findById(bill._id));

    return res.status(201).json({
      success: true,
      message: "Bill created successfully.",
      data: populatedBill,
    });
  } catch (error) {
    console.error("Create bill error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create bill.",
    });
  }
};

// GET ALL BILLS FOR A PROPERTY
export const getBills = async (req, res) => {
  try {
    if (req.authRole !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only owners can view these bills.",
      });
    }

    const { propertyId } = req.params;
    const { unitId, tenantId } = req.query;

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const filter = {
      property: property._id,
    };

    if (unitId) {
      if (!mongoose.Types.ObjectId.isValid(unitId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid unit ID.",
        });
      }

      filter.unit = unitId;
    }

    if (tenantId) {
      if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid tenant ID.",
        });
      }

      filter.tenant = tenantId;
    }

    const bills = await populateBill(Bill.find(filter).sort({ createdAt: -1 }));

    return res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
    });
  } catch (error) {
    console.error("Get bills error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bills.",
    });
  }
};

// GET SINGLE BILL
export const getBillById = async (req, res) => {
  try {
    if (req.authRole !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only owners can view this bill.",
      });
    }

    const { propertyId, billId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bill ID.",
      });
    }

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const bill = await populateBill(
      Bill.findOne({
        _id: billId,
        property: property._id,
      }),
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error("Get bill error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bill.",
    });
  }
};

// UPDATE BILL
export const updateBill = async (req, res) => {
  try {
    if (req.authRole !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only owners can update bills.",
      });
    }

    const { propertyId, billId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bill ID.",
      });
    }

    const property = await getOwnedProperty(propertyId, req.user._id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const bill = await Bill.findOne({
      _id: billId,
      property: property._id,
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found.",
      });
    }

    if (bill.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Paid bills cannot be edited.",
      });
    }

    if (bill.paymentStatus === "reserved") {
      return res.status(400).json({
        success: false,
        message:
          "Bills currently reserved in an open checkout cannot be edited.",
      });
    }

    const {
      billName,
      category,
      amount,
      month,
      year,
      startDate,
      endDate,
      dueDate,
    } = req.body;

    if (billName !== undefined) {
      if (typeof billName !== "string" || !billName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Bill name is required.",
        });
      }

      bill.billName = billName.trim();
    }

    if (category !== undefined) {
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid bill category.",
        });
      }

      bill.category = category;
    }

    if (amount !== undefined) {
      const billAmount = Number(amount);

      if (!Number.isFinite(billAmount) || billAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid bill amount.",
        });
      }

      bill.amount = billAmount;
    }

    if (month !== undefined) {
      const billMonth = Number(month);

      if (!Number.isInteger(billMonth) || billMonth < 1 || billMonth > 12) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid bill month.",
        });
      }

      bill.month = billMonth;
    }

    if (year !== undefined) {
      const billYear = Number(year);

      if (!Number.isInteger(billYear) || billYear < 2000) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid bill year.",
        });
      }

      bill.year = billYear;
    }

    if (startDate !== undefined) {
      bill.startDate = startDate;
    }

    if (endDate !== undefined) {
      bill.endDate = endDate;
    }

    if (dueDate !== undefined) {
      if (!isValidDate(dueDate)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid due date.",
        });
      }

      bill.dueDate = dueDate;
    }

    const dateError = validateBillDates(bill.startDate, bill.endDate);

    if (dateError) {
      return res.status(400).json({
        success: false,
        message: dateError,
      });
    }

    // Prevent duplicate bills when editing.
    const duplicateBill = await Bill.findOne({
      _id: { $ne: bill._id },
      tenant: bill.tenant,
      category: bill.category,
      month: bill.month,
      year: bill.year,
    }).select("_id");

    if (duplicateBill) {
      return res.status(409).json({
        success: false,
        message: `A ${bill.category} bill already exists for this tenant for ${bill.month}/${bill.year}.`,
      });
    }

    await bill.save();

    const updatedBill = await populateBill(Bill.findById(bill._id));

    return res.status(200).json({
      success: true,
      message: "Bill updated successfully.",
      data: updatedBill,
    });
  } catch (error) {
    console.error("Update bill error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update bill.",
    });
  }
};
