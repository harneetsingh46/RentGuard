import mongoose from "mongoose";
import crypto from "crypto";
import PDFDocument from "pdfkit";

import { Payment } from "../models/payment.model.js";
import { Order } from "../models/order.model.js";
import { Bill } from "../models/bill.model.js";
import { Property } from "../models/property.model.js";
import razorpay from "../utils/razorpay.js";

// 1. TENANT: CREATE RAZORPAY PAYMENT ORDER

export const createPaymentOrder = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        success: false,
        message: "Only tenants can make payments.",
      });
    }

    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID.",
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

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This Order is not available for payment.",
      });
    }

    // Prevent checkout after the reservation expires.
    if (new Date(order.expiresAt).getTime() <= Date.now()) {
      return res.status(410).json({
        success: false,
        message: "This Order has expired. Please create a new Order.",
      });
    }

    if (!order.items?.length || order.totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order details.",
      });
    }

    const billIds = order.items.map((item) => item.bill);

    // Every Bill must still be reserved by this exact Order.
    const reservedBills = await Bill.find({
      _id: { $in: billIds },
      tenant: req.user._id,
      property: order.property,
      unit: order.unit,
      paymentStatus: "reserved",
      reservedByOrder: order._id,
    });

    if (reservedBills.length !== billIds.length) {
      return res.status(409).json({
        success: false,
        message: "Some Bills are no longer reserved for this Order.",
      });
    }

    let existingPayment = await Payment.findOne({
      order: order._id,
      tenant: req.user._id,
    });

    if (existingPayment?.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "This Order has already been paid.",
      });
    }

    // Reuse an existing Razorpay order for a checkout retry.
    if (
      existingPayment?.status === "created" &&
      existingPayment.razorpayOrderId
    ) {
      return res.status(200).json({
        success: true,
        message: "Payment Order already exists.",
        data: {
          paymentId: existingPayment._id,
          orderId: existingPayment.razorpayOrderId,
          amount: Math.round(existingPayment.amount * 100),
          currency: "INR",
          rentGuardOrderId: order._id,
        },
      });
    }

    const amountInPaise = Math.round(order.totalAmount * 100);

    // Create Razorpay order.
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rg_${order._id.toString().slice(-12)}_${Date.now()
        .toString()
        .slice(-8)}`,
    });

    let payment;

    if (existingPayment) {
      // Reuse an existing failed Payment record.
      existingPayment.razorpayOrderId = razorpayOrder.id;
      existingPayment.razorpayPaymentId = null;
      existingPayment.razorpaySignature = null;
      existingPayment.amount = order.totalAmount;
      existingPayment.status = "created";
      existingPayment.paidAt = null;

      payment = await existingPayment.save();
    } else {
      payment = await Payment.create({
        order: order._id,
        tenant: req.user._id,
        property: order.property,
        unit: order.unit,
        amount: order.totalAmount,
        razorpayOrderId: razorpayOrder.id,
        status: "created",
      });
    }

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.status(201).json({
      success: true,
      message: "Payment Order created successfully.",
      data: {
        paymentId: payment._id,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        rentGuardOrderId: order._id,
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment Order.",
    });
  }
};

// 2. TENANT: VERIFY RAZORPAY PAYMENT

export const verifyPayment = async (req, res) => {
  let session;

  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        success: false,
        message: "Only tenants can verify payments.",
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string" ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required.",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      tenant: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found.",
      });
    }

    if (payment.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified.",
      });
    }

    if (payment.status !== "created") {
      return res.status(400).json({
        success: false,
        message: "This Payment cannot be verified.",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay secret key is not configured.");
    }

    // Verify Razorpay signature.
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const generatedBuffer = Buffer.from(generatedSignature);
    const receivedBuffer = Buffer.from(razorpay_signature);

    if (
      generatedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(generatedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    // Verify payment details directly with Razorpay.
    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

    if (razorpayPayment.order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Payment does not belong to this Order.",
      });
    }

    if (razorpayPayment.currency !== "INR") {
      return res.status(400).json({
        success: false,
        message: "Invalid payment currency.",
      });
    }

    const expectedAmount = Math.round(payment.amount * 100);

    if (razorpayPayment.amount !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: "Payment amount does not match.",
      });
    }

    if (razorpayPayment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: "Payment has not been captured.",
      });
    }

    // A captured payment may be verified after the reservation expiry.
    // We still require the Bills to belong to this exact Order.
    session = await mongoose.startSession();

    let updatedPayment;
    let updatedOrder;
    let alreadyPaid = false;

    await session.withTransaction(async () => {
      const currentPayment = await Payment.findOne({
        _id: payment._id,
        tenant: req.user._id,
        razorpayOrderId: razorpay_order_id,
      }).session(session);

      if (!currentPayment) {
        throw new Error("Payment record not found.");
      }

      // Handle repeated verification safely.
      if (currentPayment.status === "paid") {
        alreadyPaid = true;
        return;
      }

      if (currentPayment.status !== "created") {
        throw new Error("Payment is no longer available for verification.");
      }

      const order = await Order.findOne({
        _id: currentPayment.order,
        tenant: req.user._id,
        status: "pending",
      }).session(session);

      if (!order) {
        throw new Error("RentGuard Order not found or is not pending.");
      }

      const billIds = order.items.map((item) => item.bill);

      // Verify that every Bill is still reserved by this Order.
      const reservedBills = await Bill.find({
        _id: { $in: billIds },
        tenant: req.user._id,
        property: order.property,
        unit: order.unit,
        paymentStatus: "reserved",
        reservedByOrder: order._id,
      }).session(session);

      if (
        billIds.length !== order.items.length ||
        reservedBills.length !== billIds.length
      ) {
        throw new Error(
          "Some Bills are no longer reserved for this Order. Payment requires manual review.",
        );
      }

      const paidAt = new Date();

      // Mark all Bills as paid and release their reservation reference.
      const billUpdate = await Bill.updateMany(
        {
          _id: { $in: billIds },
          tenant: req.user._id,
          property: order.property,
          unit: order.unit,
          paymentStatus: "reserved",
          reservedByOrder: order._id,
        },
        {
          $set: {
            paymentStatus: "paid",
            paidAt,
            reservedByOrder: null,
          },
        },
        { session },
      );

      if (billUpdate.modifiedCount !== billIds.length) {
        throw new Error("Unable to update all Bills.");
      }

      // Mark RentGuard Order as paid.
      updatedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          tenant: req.user._id,
          status: "pending",
        },
        {
          $set: {
            status: "paid",
            razorpayPaymentId: razorpay_payment_id,
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!updatedOrder) {
        throw new Error("Unable to update RentGuard Order.");
      }

      // Mark Payment as paid.
      updatedPayment = await Payment.findOneAndUpdate(
        {
          _id: currentPayment._id,
          status: "created",
        },
        {
          $set: {
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: "paid",
            paidAt,
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!updatedPayment) {
        throw new Error("Unable to update Payment record.");
      }
    });

    if (alreadyPaid) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      data: {
        payment: updatedPayment,
        order: updatedOrder,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to verify payment.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// 3. TENANT: GET MY PAYMENTS
export const getMyPayments = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        message: "Only tenants can access payments.",
      });
    }

    const payments = await Payment.find({
      tenant: req.user._id,
    })
      .populate({
        path: "order",
        populate: {
          path: "items.bill",
          model: "Bill",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Get tenant payments error:", error);

    return res.status(500).json({
      message: "Unable to fetch payment history.",
    });
  }
};

// 4. OWNER: GET PROPERTY PAYMENTS
export const getPropertyPayments = async (req, res) => {
  try {
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can access property payments.",
      });
    }

    const { propertyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        message: "Invalid Property ID.",
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

    const payments = await Payment.find({
      property: propertyId,
    })
      .populate("tenant", "fullName email phone")
      .populate("unit", "unitName unitType")
      .populate({
        path: "order",
        populate: {
          path: "items.bill",
          model: "Bill",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Get property payments error:", error);

    return res.status(500).json({
      message: "Unable to fetch property payments.",
    });
  }
};


// SHARED: GENERATE PAYMENT RECEIPT PDF
const generatePaymentReceipt = (res, payment, property) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    info: {
      Title: "RentGuard Payment Receipt",
      Author: "RentGuard",
    },
  });

  const receiptNumber = `RG-${payment._id
    .toString()
    .slice(-8)
    .toUpperCase()}`;

  const paymentDate = new Date(
    payment.paidAt || payment.updatedAt || payment.createdAt
  );

  const formattedDate = paymentDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formatAmount = (amount) =>
    `INR ${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="RentGuard-Receipt-${receiptNumber}.pdf"`
  );

  doc.pipe(res);

  doc
    .fontSize(24)
    .fillColor("#171717")
    .text("RentGuard", { align: "center" });

  doc
    .moveDown(0.5)
    .fontSize(16)
    .text("PAYMENT RECEIPT", { align: "center" });

  doc.moveDown(1.5);

  doc.fontSize(11).fillColor("#333333");

  doc.text(`Receipt Number: ${receiptNumber}`);
  doc.text(`Payment Date: ${formattedDate}`);
  doc.text(`Payment ID: ${payment.razorpayPaymentId || "N/A"}`);

  doc.moveDown();

  doc.fontSize(14).fillColor("#171717").text("Property Details");

  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#333333");

  doc.text(`Property: ${property.propertyName || "N/A"}`);
  doc.text(`Address: ${property.address || "N/A"}`);
  doc.text(`Unit: ${payment.unit?.unitName || "N/A"}`);

  doc.moveDown();

  doc.fontSize(14).fillColor("#171717").text("Tenant Details");

  doc.moveDown(0.5);
  doc.fontSize(11).fillColor("#333333");

  doc.text(`Tenant Name: ${payment.tenant?.fullName || "N/A"}`);
  doc.text(`Tenant Email: ${payment.tenant?.email || "N/A"}`);

  doc.moveDown();

  doc.fontSize(14).fillColor("#171717").text("Bill Details");

  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#333333");

  payment.order.items.forEach((item, index) => {
    const bill = item.bill;

    if (!bill) return;

    doc.text(
      `${index + 1}. ${bill.billName} (${bill.category}) - ${formatAmount(
        item.amount
      )}`
    );

    doc.text(
      `   Billing Period: ${bill.month}/${bill.year} | Due: ${
        bill.dueDate
          ? new Date(bill.dueDate).toLocaleDateString("en-IN")
          : "N/A"
      }`
    );
  });

  doc.moveDown();

  doc
    .fontSize(13)
    .fillColor("#171717")
    .text(`Total Amount Paid: ${formatAmount(payment.amount)}`);

  doc.text("Payment Status: PAID");

  doc.moveDown(2);

  doc.fontSize(12).text("Thank you for your payment.", {
    align: "center",
  });

  doc
    .moveDown(0.5)
    .fontSize(9)
    .fillColor("#777777")
    .text("Generated by RentGuard.", {
      align: "center",
    });

  doc.end();
};


// 5. OWNER: DOWNLOAD PAYMENT RECEIPT
export const downloadPaymentReceipt = async (req, res) => {
  try {
    if (req.authRole !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only owners can download payment receipts.",
      });
    }

    const { propertyId, paymentId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(propertyId) ||
      !mongoose.Types.ObjectId.isValid(paymentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID.",
      });
    }

    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or access denied.",
      });
    }

    const payment = await Payment.findOne({
      _id: paymentId,
      property: propertyId,
      status: "paid",
    })
      .populate("tenant", "fullName email phone")
      .populate("unit", "unitName unitType")
      .populate({
        path: "order",
        populate: {
          path: "items.bill",
          model: "Bill",
        },
      });

    if (!payment || !payment.order) {
      return res.status(404).json({
        success: false,
        message: "Successful payment not found.",
      });
    }

    return generatePaymentReceipt(res, payment, property);
  } catch (error) {
    console.error("Download owner receipt error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate payment receipt.",
      });
    }

    res.destroy(error);
  }
};


// 6. TENANT: DOWNLOAD OWN PAYMENT RECEIPT
export const downloadMyPaymentReceipt = async (req, res) => {
  try {
    if (req.authRole !== "tenant") {
      return res.status(403).json({
        success: false,
        message: "Only tenants can download their payment receipts.",
      });
    }

    const { paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Payment ID.",
      });
    }

    const payment = await Payment.findOne({
      _id: paymentId,
      tenant: req.user._id,
      status: "paid",
    })
      .populate("tenant", "fullName email phone")
      .populate("unit", "unitName unitType")
      .populate({
        path: "order",
        populate: {
          path: "items.bill",
          model: "Bill",
        },
      });

    if (!payment || !payment.order) {
      return res.status(404).json({
        success: false,
        message: "Successful payment not found.",
      });
    }

    const property = await Property.findById(payment.property);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    return generatePaymentReceipt(res, payment, property);
  } catch (error) {
    console.error("Download tenant receipt error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate payment receipt.",
      });
    }

    res.destroy(error);
  }
};
