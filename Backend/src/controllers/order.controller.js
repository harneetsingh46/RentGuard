import mongoose from "mongoose";
import { Bill } from "../models/bill.model.js";
import { Order } from "../models/order.model.js";

import { Payment } from "../models/payment.model.js";
import razorpay from "../utils/razorpay.js";

import {
  checkCapturedPayment,
  settleCapturedPayment,
  sendPaidEmails,
} from "../utils/paymentSettlement.js";

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


export const handleCheckoutDismissal = async (req, res) => {
  let session;

  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        success: false,
        message: "Tenant access required.",
      });
    }

    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      tenant: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.status === "paid") {
      return res.status(200).json({
        success: true,
        data: { status: "paid" },
        message: "This order has already been paid.",
      });
    }

    if (order.status === "cancelled") {
      return res.status(200).json({
        success: true,
        data: { status: "cancelled" },
        message: "This order has already been cancelled.",
      });
    }

    if (order.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: "This order is no longer available.",
      });
    }

    // Check Razorpay before counting a dismissal or releasing bills.
    if (!order.razorpayOrderId) {
      return res.status(409).json({
        success: false,
        message: "Razorpay order is not available yet.",
      });
    }

    const razorpayPayments = await razorpay.orders.fetchPayments(
      order.razorpayOrderId
    );

    const remotePayments = razorpayPayments?.items || [];

    const capturedPayment = remotePayments.find(
      (item) => item.status === "captured"
    );

    if (capturedPayment) {
      const payment = await Payment.findOne({
        order: order._id,
        tenant: req.user._id,
        razorpayOrderId: order.razorpayOrderId,
      });

      if (!payment) {
        return res.status(409).json({
          success: false,
          code: "PAYMENT_RECORD_MISSING",
          message:
            "Razorpay received a payment, but RentGuard could not find its payment record. Please contact support.",
        });
      }

      const check = await checkCapturedPayment(
        payment,
        capturedPayment.id
      );

      if (!check.ok) {
        return res.status(409).json({
          success: false,
          message: check.reason || "Payment verification is pending.",
        });
      }

      const outcome = await settleCapturedPayment({
        paymentId: payment._id,
        razorpayPaymentId: capturedPayment.id,
      });

      if (outcome === "paid") {
        await sendPaidEmails(payment._id);
      }

      if (outcome === "needs_refund") {
        return res.status(409).json({
          success: false,
          code: "PAYMENT_REQUIRES_REFUND",
          message:
            "Payment was received but requires refund reconciliation. Please contact support.",
        });
      }

      return res.status(200).json({
        success: true,
        data: { status: "paid" },
        message: "Your payment was received successfully.",
      });
    }

    // An authorized payment may still be captured.
    // Never release its bills while it is processing.
    const authorizedPayment = remotePayments.find(
      (item) => item.status === "authorized"
    );

    if (authorizedPayment) {
      return res.status(409).json({
        success: false,
        code: "PAYMENT_PROCESSING",
        message:
          "Your payment is still processing. Please wait and refresh your payment history before trying again.",
      });
    }

    session = await mongoose.startSession();

    let result;

    await session.withTransaction(async () => {
      const currentOrder = await Order.findOne({
        _id: order._id,
        tenant: req.user._id,
      }).session(session);

      if (!currentOrder) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (currentOrder.status === "paid") {
        result = { status: "paid" };
        return;
      }

      if (currentOrder.status === "cancelled") {
        result = { status: "cancelled" };
        return;
      }

      if (currentOrder.status !== "pending") {
        throw new Error("ORDER_NOT_PENDING");
      }

      currentOrder.checkoutDismissals =
        (currentOrder.checkoutDismissals || 0) + 1;

      // First dismissal: keep the order and reservations.
      if (currentOrder.checkoutDismissals < 2) {
        await currentOrder.save({ session });

        result = {
          status: "retry_available",
          dismissals: currentOrder.checkoutDismissals,
          remainingRetries: 1,
        };

        return;
      }

      // Second dismissal: release only bills reserved by this order.
      const billIds = currentOrder.items.map((item) => item.bill);

      const releaseResult = await Bill.updateMany(
        {
          _id: { $in: billIds },
          tenant: req.user._id,
          property: currentOrder.property,
          unit: currentOrder.unit,
          paymentStatus: "reserved",
          reservedByOrder: currentOrder._id,
        },
        {
          $set: {
            paymentStatus: "unpaid",
            reservedByOrder: null,
          },
        },
        { session }
      );

      if (releaseResult.modifiedCount !== billIds.length) {
        throw new Error("BILL_RELEASE_MISMATCH");
      }

      currentOrder.status = "cancelled";
      await currentOrder.save({ session });

      // Keep the payment document for the owner's audit history.
      await Payment.updateOne(
        {
          order: currentOrder._id,
          status: { $in: ["created", "failed"] },
        },
        {
          $set: { status: "failed" },
        },
        { session }
      );

      result = {
        status: "cancelled",
        dismissals: currentOrder.checkoutDismissals,
        remainingRetries: 0,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
      message:
        result.status === "cancelled"
          ? "Checkout limit reached. Your order was cancelled and its bills are available again."
          : result.status === "paid"
            ? "Your payment has already been completed."
            : "Checkout closed. You have one retry remaining.",
    });
  } catch (error) {
    console.error("Checkout dismissal error:", error);

    if (error.message === "BILL_RELEASE_MISMATCH") {
      return res.status(409).json({
        success: false,
        message:
          "Bills could not safely be released. Please refresh your payment page.",
      });
    }

    if (error.message === "ORDER_NOT_PENDING") {
      return res.status(409).json({
        success: false,
        message: "This order is no longer pending.",
      });
    }

    if (error.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to process checkout dismissal.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
