import { Property } from "../models/property.model.js";
import { Unit } from "../models/unit.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Rent } from "../models/rent.model.js";
export const createRent = async (req, res, next) => {
  try {
    const { propertyId, tenantId } = req.params;
    const { month, year, dueDate } = req.body;
    if (!month || month < 1 || month > 12 || !year) {
      return res.status(400).json({
        message:
          "Month, Year and Due Date is required and Month must be between 1 and 12 !",
      });
    }
    if (isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({
        message: "Invalid due date!",
      });
    }
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can create rent!",
      });
    }
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(400).json({
        message: "No property found !",
      });
    }
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized for this property!",
      });
    }
    const tenant = await Tenant.findOne({
      _id: tenantId,
      property: propertyId,
    });
    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found!",
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
    if (unit.status !== "occupied") {
      return res.status(400).json({
        message: "Unit is not occupied!",
      });
    }
    const isRentExists = await Rent.findOne({
      tenant: tenantId,
      month,
      year,
    });
    if (isRentExists) {
      return res.status(400).json({
        message: "Rent Already Exists !",
      });
    }
    const rent = await Rent.create({
      tenant: tenantId,
      property: propertyId,
      unit: unit._id,
      amount: unit.rent,
      month,
      year,
      dueDate,
      status: "pending",
    });
    return res.status(201).json({
      message: "Rent Created Successfully!",
      data: rent,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

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
        message: "No property found!",
      });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized for this property!",
      });
    }

    const getRents = await Rent.find({
      property: propertyId,
    })
      .populate("tenant", "fullName")
      .populate("unit", "unitName unitType rent status")
      .sort({ year: -1, month: -1 });

    if (getRents.length === 0) {
      return res.status(404).json({
        message: "No rents found!",
      });
    }

    return res.status(200).json({
      message: "Rent(s) Fetched Successfully!",
      data: getRents,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

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
        message: "No property found!",
      });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized for this property!",
      });
    }

    const tenant = await Tenant.findOne({
      _id: tenantId,
      property: propertyId,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found!",
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

    if (unit.status !== "occupied") {
      return res.status(400).json({
        message: "Unit is not occupied!",
      });
    }

    const rents = await Rent.find({
      tenant: tenantId,
      property: propertyId,
      unit: unit._id,
    }).sort({
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
        message: "No property found!",
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
    }).populate({
      path: "tenant",
      select: "fullName address aadhaarNumber photo",
      populate: {
        path: "user",
        select: "phone isActive",
      },
    })
    .populate("unit", "unitName unitType rent status")
    if (!rent) {
      return res.status(404).json({
        message: "No rent found!",
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

//tenant-side


export const getMyRents = async (req, res, next) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenant can access rents!",
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

export const getMyRent = async (req, res, next) => {
  try {
    const { rentId } = req.params;

    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenant can access rent!",
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

    if (isNaN(new Date(dueDate).getTime())) {
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

    if (rent.status === "paid") {
      return res.status(400).json({
        message: "Paid rent cannot be updated!",
      });
    }

    rent.dueDate = dueDate;

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