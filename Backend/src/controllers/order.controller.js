import mongoose from "mongoose";
import { Bill } from "../models/bill.model.js";
import { Order } from "../models/order.model.js";

// Get all unpaid bills for the logged-in tenant
export const getMyUnpaidBills = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        success: false,
        message: "Tenant access required.",
      });
    }

    const bills = await Bill.find({
      tenant: req.user._id,
      property: req.user.property,
      unit: req.user.unit,
      paymentStatus: "unpaid",
      reservedByOrder: null,
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

// Create one Order for multiple selected Bills

export const createOrder = async (req, res) => {
  if (req.authRole !== "tenant") {
    return res.status(403).json({
      success: false,
      message: "Tenant access required.",
    });
  }

  const { billIds } = req.body;

  if (!Array.isArray(billIds) || billIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please select at least one bill.",
    });
  }

  if (billIds.length > 50) {
    return res.status(400).json({
      success: false,
      message: "You can select a maximum of 50 bills.",
    });
  }

  const uniqueBillIds = [...new Set(billIds.map(String))];

  if (uniqueBillIds.length !== billIds.length) {
    return res.status(400).json({
      success: false,
      message: "Duplicate bills are not allowed.",
    });
  }

  if (uniqueBillIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    return res.status(400).json({
      success: false,
      message: "Invalid bill ID.",
    });
  }

  let session;

  try {
    session = await mongoose.startSession();

    let createdOrder;

    await session.withTransaction(async () => {
      const bills = await Bill.find({
        _id: { $in: uniqueBillIds },
        tenant: req.user._id,
        property: req.user.property,
        unit: req.user.unit,
        paymentStatus: "unpaid",
        reservedByOrder: null,
      }).session(session);

      if (bills.length !== uniqueBillIds.length) {
        throw new Error(
          "Some bills are unavailable or have already been reserved or paid.",
        );
      }

      const totalAmount = Number(
        bills.reduce((total, bill) => total + bill.amount, 0).toFixed(2),
      );

      const [order] = await Order.create(
        [
          {
            tenant: req.user._id,
            property: req.user.property,
            unit: req.user.unit,
            items: bills.map((bill) => ({
              bill: bill._id,
              amount: bill.amount,
            })),
            totalAmount,
            status: "pending",
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        ],
        { session },
      );

      const reservation = await Bill.updateMany(
        {
          _id: { $in: uniqueBillIds },
          tenant: req.user._id,
          property: req.user.property,
          unit: req.user.unit,
          paymentStatus: "unpaid",
          reservedByOrder: null,
        },
        {
          $set: {
            paymentStatus: "reserved",
            reservedByOrder: order._id,
          },
        },
        { session },
      );

      if (reservation.modifiedCount !== uniqueBillIds.length) {
        throw new Error("Some bills could not be reserved. Please try again.");
      }

      createdOrder = order;
    });

    if (!createdOrder) {
      throw new Error("Order creation failed.");
    }

    const populatedOrder = await Order.findById(createdOrder._id).populate(
      "items.bill",
    );

    return res.status(201).json({
      success: true,
      message: "Order created and bills reserved successfully.",
      data: populatedOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create order.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// Get all Orders belonging to the logged-in tenant
export const getMyOrders = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        success: false,
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
    console.error("Get my orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders.",
    });
  }
};
