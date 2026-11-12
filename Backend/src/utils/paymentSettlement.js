import mongoose from "mongoose";

import razorpay from "./razorpay.js";
import { Payment } from "../models/payment.model.js";
import { Order } from "../models/order.model.js";
import { Bill } from "../models/bill.model.js";
import { sendPaymentConfirmationEmails } from "./email.js";

// Verify the payment directly with Razorpay.
export const checkCapturedPayment = async (payment, razorpayPaymentId) => {
  const remotePayment = await razorpay.payments.fetch(razorpayPaymentId);

  if (!remotePayment) {
    return { ok: false, reason: "Payment not found at Razorpay." };
  }

  if (remotePayment.order_id !== payment.razorpayOrderId) {
    return { ok: false, reason: "Payment order does not match." };
  }

  if (remotePayment.currency !== "INR") {
    return { ok: false, reason: "Invalid payment currency." };
  }

  if (
    Number(remotePayment.amount) !== Math.round(Number(payment.amount) * 100)
  ) {
    return { ok: false, reason: "Payment amount does not match." };
  }

  if (remotePayment.status !== "captured") {
    return {
      ok: false,
      reason: "Payment has not been captured by Razorpay.",
    };
  }

  return { ok: true, payment: remotePayment };
};

// Settle bills and payment atomically.
export const settleCapturedPayment = async ({
  paymentId,
  razorpayPaymentId,
  razorpaySignature = null,
}) => {
  const session = await mongoose.startSession();
  let outcome = "failed";

  try {
    await session.withTransaction(async () => {
      const payment = await Payment.findById(paymentId).session(session);

      if (!payment) {
        throw new Error("Payment record not found.");
      }

      if (payment.status === "paid") {
        outcome = "already_paid";
        return;
      }

      if (payment.status === "needs_refund") {
        outcome = "needs_refund";
        return;
      }

      const order = await Order.findById(payment.order).session(session);

      if (!order || order.status !== "pending") {
        payment.status = "needs_refund";
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpaySignature = razorpaySignature;
        await payment.save({ session });

        outcome = "needs_refund";
        return;
      }

      const billIds = order.items.map((item) => item.bill);

      const reservationResult = await Bill.updateMany(
        {
          _id: { $in: billIds },
          tenant: payment.tenant,
          property: payment.property,
          unit: payment.unit,
          paymentStatus: "reserved",
          reservedByOrder: order._id,
        },
        {
          $set: {
            paymentStatus: "paid",
            paidAt: new Date(),
            reservedByOrder: null,
          },
        },
        { session },
      );

      if (reservationResult.modifiedCount !== billIds.length) {
        // Roll back any partial bill updates before recording refund status.
        throw new Error("BILL_RESERVATION_MISMATCH");
      }

      const orderResult = await Order.updateOne(
        { _id: order._id, status: "pending" },
        {
          $set: {
            status: "paid",
            razorpayPaymentId,
          },
        },
        { session },
      );

      if (orderResult.modifiedCount !== 1) {
        throw new Error("ORDER_SETTLEMENT_CONFLICT");
      }

      const paymentResult = await Payment.updateOne(
        {
          _id: payment._id,
          status: { $in: ["created", "failed"] },
        },
        {
          $set: {
            status: "paid",
            razorpayPaymentId,
            razorpaySignature,
            paidAt: new Date(),
          },
        },
        { session },
      );

      if (paymentResult.modifiedCount !== 1) {
        throw new Error("PAYMENT_SETTLEMENT_CONFLICT");
      }

      outcome = "paid";
    });

    return outcome;
  } catch (error) {
    if (
      error.message === "BILL_RESERVATION_MISMATCH" ||
      error.message === "ORDER_SETTLEMENT_CONFLICT"
    ) {
      await Payment.updateOne(
        {
          _id: paymentId,
          status: { $ne: "paid" },
        },
        {
          $set: {
            status: "needs_refund",
            razorpayPaymentId,
            razorpaySignature,
          },
        },
      );

      return "needs_refund";
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

// Send payment confirmation emails after settlement.
export const sendPaidEmails = async (paymentId) => {
  try {
    const payment = await Payment.findById(paymentId)
      .populate("tenant", "fullName email")
      .populate("unit", "unitName")
      .populate({
        path: "order",
        populate: {
          path: "items.bill",
          model: "Bill",
        },
      });

    if (!payment || payment.status !== "paid" || !payment.order) {
      return;
    }

    const property = await mongoose
      .model("Property")
      .findById(payment.property);

    if (!property) {
      console.error("Payment email skipped: property not found.");
      return;
    }

    const owner = await mongoose
      .model("User")
      .findById(property.owner)
      .select("fullName name email");

    if (!owner) {
      console.error("Payment email skipped: owner not found.");
      return;
    }

    await sendPaymentConfirmationEmails({
      tenantEmail: payment.tenant?.email,
      tenantName: payment.tenant?.fullName,
      ownerEmail: owner.email,
      ownerName: owner.fullName || owner.name || "Property Owner",
      propertyName: property.propertyName,
      propertyAddress: property.address,
      unitName: payment.unit?.unitName,
      amount: payment.amount,
      paymentId: payment.razorpayPaymentId,
      orderId: payment.razorpayOrderId,
      bills: payment.order.items,
    });
  } catch (error) {
    console.error("Payment confirmation email error:", error);
  }
};
