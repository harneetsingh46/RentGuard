import { Bill } from "../models/bill.model.js";

export const createBill = async (req, res, next) => {
  try {
    
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

    const { billName, category, amount } = req.body;
    if (!billName || !category || !amount) {
      return res.status(400).json({
        message: "Bill Name and amount is required",
      });
    }
    const bill = await Bill.create({
      billName,
      category,
      amount,
    });
    return res.status(201).json({
      message: "Bill Created Successfully",
      data: bill,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

export const getBills = async (req, res, next) => {
  try {
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

    const bills = await Bill.find();
    if (bills.length === 0) {
      return res.status(400).json({
        message: "No Bills Found !",
      });
    }
    return res.status(200).json({
      message: "Bills Fetched Successfull !",
      data: bills,
    });
  } catch (error) {
    return res.status(500).json({
      message: message.error,
    });
  }
};

export const getBillById = async (req, res, next) => {
  try {
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

    const bill = await Rent.findOne({
      _id: rentId,
      billName,
    });
    if (bills.length === 0) {
      return res.status(400).json({
        message: "No Bills Found !",
      });
    }
    return res.status(200).json({
      message: "Bills Fetched Successfull !",
      data: bills,
    });
  } catch (error) {
    return res.status(500).json({
      message: message.error,
    });
  }
};
