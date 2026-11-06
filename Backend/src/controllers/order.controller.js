
import mongoose from "mongoose";
import { Bill } from "../models/bill.model.js";
import { Order } from "../models/order.model.js";

// 1. Get logged-in tenant's unpaid bills
export const getMyUnpaidBills = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        message: "Tenant access required.",
      });
    }

    const bills = await Bill.find({
      tenant: req.user._id,
      property: req.user.property,
      unit: req.user.unit,
      paymentStatus: "unpaid",
    }).sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
    });
  } catch (error) {
    console.error("Get unpaid bills error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch unpaid bills.",
    });
  }
};


// 2. Create one combined order from selected bills
export const createOrder = async (req, res) => {
  const reservedBillIds = [];

  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        message: "Tenant access required.",
      });
    }

    const { billIds } = req.body;

    if (!Array.isArray(billIds) || billIds.length === 0) {
      return res.status(400).json({
        message: "Please select at least one bill.",
      });
    }

    // Prevent duplicate bill IDs
    const uniqueBillIds = [...new Set(billIds.map(String))];

    if (uniqueBillIds.length !== billIds.length) {
      return res.status(400).json({
        message: "Duplicate bills are not allowed.",
      });
    }

    // Validate MongoDB IDs
    const invalidId = uniqueBillIds.some(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );

    if (invalidId) {
      return res.status(400).json({
        message: "Invalid bill ID.",
      });
    }

    // Find bills belonging to this tenant and tenancy
    const bills = await Bill.find({
      _id: { $in: uniqueBillIds },
      tenant: req.user._id,
      property: req.user.property,
      unit: req.user.unit,
      paymentStatus: "unpaid",
    });

    if (bills.length !== uniqueBillIds.length) {
      return res.status(400).json({
        message:
          "Some bills are invalid, already paid, or currently reserved.",
      });
    }

    // Calculate total using database amounts
    const totalAmount = Number(
      bills.reduce((total, bill) => total + bill.amount, 0).toFixed(2)
    );

    // Reserve each bill atomically
    for (const bill of bills) {
      const reservedBill = await Bill.findOneAndUpdate(
        {
          _id: bill._id,
          tenant: req.user._id,
          paymentStatus: "unpaid",
        },
        {
          $set: { paymentStatus: "reserved" },
        },
        {
          returnDocument: "after",
        }
      );

      if (!reservedBill) {
        throw new Error(
          "One or more bills could not be reserved. Please try again."
        );
      }

      reservedBillIds.push(bill._id);
    }

    // Create combined order
    const order = await Order.create({
      tenant: req.user._id,
      property: req.user.property,
      unit: req.user.unit,

      items: bills.map((bill) => ({
        bill: bill._id,
        amount: bill.amount,
      })),

      totalAmount,
      status: "pending",
    });

    const populatedOrder = await Order.findById(order._id).populate(
      "items.bill"
    );

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: populatedOrder,
    });

  } catch (error) {
    console.error("Create order error:", error);

    // Release bills if order creation fails
    if (reservedBillIds.length > 0) {
      await Bill.updateMany(
        {
          _id: { $in: reservedBillIds },
          paymentStatus: "reserved",
        },
        {
          $set: { paymentStatus: "unpaid" },
        }
      );
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create order.",
    });
  }
};


// 3. Get logged-in tenant's order history
export const getMyOrders = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        message: "Tenant access required.",
      });
    }

    const orders = await Order.find({
      tenant: req.user._id,
    })
      .populate("items.bill")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });

  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order history.",
    });
  }
};
