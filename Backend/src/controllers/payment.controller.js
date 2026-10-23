import { Payment } from "../models/payment.model.js";
import { Rent } from "../models/rent.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Property } from "../models/property.model.js";
import razorpay from "../utils/razorpay.js";
import PDFDocument from "pdfkit";
import crypto from "crypto";

// CREATE RAZORPAY PAYMENT ORDER
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { rentId } = req.params;

    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenant can make payment!",
      });
    }

    const tenant = await Tenant.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Active tenant profile not found!",
      });
    }

    const rent = await Rent.findOne({
      _id: rentId,
      tenant: tenant._id,
    });

    if (!rent) {
      return res.status(404).json({
        message: "Rent not found!",
      });
    }

    if (rent.status === "paid") {
      return res.status(400).json({
        message: "Rent is already paid!",
      });
    }

    const remainingAmount = rent.amount - rent.paidAmount;

    if (remainingAmount <= 0) {
      return res.status(400).json({
        message: "No amount is remaining!",
      });
    }

    const existingPayment = await Payment.findOne({
      rent: rent._id,
      tenant: tenant._id,
      status: "created",
    });

    if (existingPayment) {
      return res.status(400).json({
        message: "A payment order already exists for this rent!",
        data: {
          paymentId: existingPayment._id,
          orderId: existingPayment.razorpayOrderId,
          amount: existingPayment.amount,
        },
      });
    }

    const amountInPaise = Math.round(remainingAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rent_${rent._id}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const payment = await Payment.create({
      rent: rent._id,
      tenant: tenant._id,
      property: rent.property,
      unit: rent.unit,
      amount: remainingAmount,
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.status(201).json({
      message: "Payment order created successfully!",
      data: {
        paymentId: payment._id,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        rentId: rent._id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// VERIFY PAYMENT FROM FRONTEND
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Payment verification details are required!",
      });
    }

    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenant can verify payment!",
      });
    }

    const tenant = await Tenant.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Active tenant profile not found!",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      tenant: tenant._id,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment order not found!",
      });
    }

    if (payment.status === "paid") {
      return res.status(200).json({
        message: "Payment already verified!",
      });
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`,
      )
      .digest("hex");

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(razorpay_signature),
    );

    if (!isSignatureValid) {
      payment.status = "failed";
      await payment.save();

      return res.status(400).json({
        message: "Invalid payment signature!",
      });
    }

    // Fetch actual payment details from Razorpay
    const razorpayPayment =
      await razorpay.payments.fetch(razorpay_payment_id);

    if (
      razorpayPayment.order_id !== razorpay_order_id
    ) {
      return res.status(400).json({
        message: "Payment does not belong to this order!",
      });
    }

    if (razorpayPayment.currency !== "INR") {
      return res.status(400).json({
        message: "Invalid payment currency!",
      });
    }

    const expectedAmount = Math.round(payment.amount * 100);

    if (razorpayPayment.amount !== expectedAmount) {
      return res.status(400).json({
        message: "Payment amount does not match the rent amount!",
      });
    }

    if (razorpayPayment.status !== "captured") {
      return res.status(400).json({
        message: "Payment has not been captured!",
      });
    }

    const rent = await Rent.findById(payment.rent);

    if (!rent) {
      return res.status(404).json({
        message: "Rent not found!",
      });
    }

    if (
      rent.tenant.toString() !== tenant._id.toString()
    ) {
      return res.status(403).json({
        message: "You are not authorized for this rent!",
      });
    }

    // Prevent duplicate processing
    const updatedPayment = await Payment.findOneAndUpdate(
      {
        _id: payment._id,
        status: "created",
      },
      {
        $set: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "paid",
        },
      },
      {
        new: true,
      },
    );

    if (!updatedPayment) {
      return res.status(200).json({
        message: "Payment already processed!",
      });
    }

    // Update rent
    rent.paidAmount += payment.amount;

    if (rent.paidAmount >= rent.amount) {
      rent.paidAmount = rent.amount;
      rent.status = "paid";
    } else {
      rent.status = "partial";
    }

    await rent.save();

    return res.status(200).json({
      message: "Payment verified successfully!",
      data: {
        payment: updatedPayment,
        rent,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// TENANT: GET MY PAYMENTS
export const getMyPayments = async (req, res, next) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({
        message: "Only tenant can access payments!",
      });
    }

    const tenant = await Tenant.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant profile not found!",
      });
    }

    const payments = await Payment.find({
      tenant: tenant._id,
    })
      .populate(
        "rent",
        "amount paidAmount month year dueDate status",
      )
      .sort({ createdAt: -1 });

    if (payments.length === 0) {
      return res.status(404).json({
        message: "No payments found!",
      });
    }

    return res.status(200).json({
      message: "Payments fetched successfully!",
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// OWNER: GET PROPERTY PAYMENTS
export const getPropertyPayments = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can access payments!",
      });
    }

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found!",
      });
    }

    if (
      property.owner.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "You are not authorized for this property!",
      });
    }

    const payments = await Payment.find({
      property: propertyId,
    })
      .populate("tenant", "fullName")
      .populate("unit", "unitName unitType")
      .populate(
        "rent",
        "amount paidAmount month year dueDate status",
      )
      .sort({ createdAt: -1 });

    if (payments.length === 0) {
      return res.status(404).json({
        message: "No payments found!",
      });
    }

    return res.status(200).json({
      message: "Property payments fetched successfully!",
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// RAZORPAY WEBHOOK
export const razorpayWebhook = async (req, res, next) => {
  try {
    const webhookSignature =
      req.headers["x-razorpay-signature"];

    if (!webhookSignature) {
      return res.status(400).json({
        message: "Webhook signature missing!",
      });
    }

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_WEBHOOK_SECRET,
      )
      .update(req.body)
      .digest("hex");

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(webhookSignature),
    );

    if (!isSignatureValid) {
      return res.status(400).json({
        message: "Invalid webhook signature!",
      });
    }

    const event = JSON.parse(req.body.toString());

    // Only process successful captured payments
    if (event.event !== "payment.captured") {
      return res.status(200).json({
        message: "Webhook received!",
      });
    }

    const razorpayPayment =
      event.payload.payment.entity;

    const payment = await Payment.findOne({
      razorpayOrderId: razorpayPayment.order_id,
    });

    if (!payment) {
      return res.status(200).json({
        message: "Payment record not found!",
      });
    }

    // Prevent duplicate webhook processing
    if (payment.status === "paid") {
      return res.status(200).json({
        message: "Payment already processed!",
      });
    }

    const expectedAmount = Math.round(payment.amount * 100);

    if (razorpayPayment.amount !== expectedAmount) {
      return res.status(400).json({
        message: "Webhook payment amount does not match!",
      });
    }

    if (razorpayPayment.currency !== "INR") {
      return res.status(400).json({
        message: "Invalid webhook payment currency!",
      });
    }

    const rent = await Rent.findById(payment.rent);

    if (!rent) {
      return res.status(200).json({
        message: "Rent not found!",
      });
    }

    // Atomically mark payment as paid.
    // This prevents the same payment from being processed twice.
    const updatedPayment = await Payment.findOneAndUpdate(
      {
        _id: payment._id,
        status: "created",
      },
      {
        $set: {
          razorpayPaymentId: razorpayPayment.id,
          status: "paid",
        },
      },
      {
        new: true,
      },
    );

    if (!updatedPayment) {
      return res.status(200).json({
        message: "Payment already processed!",
      });
    }

    rent.paidAmount += payment.amount;

    if (rent.paidAmount >= rent.amount) {
      rent.paidAmount = rent.amount;
      rent.status = "paid";
    } else {
      rent.status = "partial";
    }

    await rent.save();

    return res.status(200).json({
      message: "Webhook processed successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// OWNER: DOWNLOAD PAYMENT RECEIPT
export const downloadPaymentReceipt = async (req, res) => {
  try {
    const { propertyId, paymentId } = req.params;

    // Only owners can download property payment receipts
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owners can download payment receipts.",
      });
    }

    // Check that the property exists and belongs to this owner
    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found or access denied.",
      });
    }

    // Find a successful payment belonging to this property
    const payment = await Payment.findOne({
      _id: paymentId,
      property: propertyId,
      status: "paid",
    })
      .populate("tenant", "fullName")
      .populate("unit", "unitName")
      .populate("rent", "month year amount");

    if (!payment) {
      return res.status(404).json({
        message: "Successful payment not found.",
      });
    }

    // Create a PDF receipt
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

    const paymentDate = new Date(payment.createdAt);

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

    // Set download headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="RentGuard-Receipt-${receiptNumber}.pdf"`
    );

    // Send the PDF directly to the browser
    doc.pipe(res);

    // Receipt heading
    doc
      .fontSize(24)
      .fillColor("#171717")
      .text("RentGuard", { align: "center" });

    doc
      .moveDown(0.5)
      .fontSize(16)
      .text("PAYMENT RECEIPT", { align: "center" });

    doc.moveDown(1.5);

    // Receipt details
    doc.fontSize(11).fillColor("#333333");

    doc.text(`Receipt Number: ${receiptNumber}`);
    doc.text(`Payment Date: ${formattedDate}`);
    doc.text(`Payment ID: ${payment.razorpayPaymentId || "N/A"}`);

    doc.moveDown();

    // Property details
    doc
      .fontSize(14)
      .fillColor("#171717")
      .text("Property Details");

    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#333333");

    doc.text(`Property: ${property.propertyName}`);
    doc.text(`Address: ${property.address || "N/A"}`);
    doc.text(`Unit: ${payment.unit?.unitName || "N/A"}`);

    doc.moveDown();

    // Tenant details
    doc
      .fontSize(14)
      .fillColor("#171717")
      .text("Tenant Details");

    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#333333");

    doc.text(`Tenant Name: ${payment.tenant?.fullName || "N/A"}`);

    doc.moveDown();

    // Payment details
    doc
      .fontSize(14)
      .fillColor("#171717")
      .text("Payment Details");

    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#333333");

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const rentPeriod =
      payment.rent &&
      payment.rent.month >= 1 &&
      payment.rent.month <= 12
        ? `${monthNames[payment.rent.month - 1]} ${payment.rent.year}`
        : "N/A";

    doc.text(`Rent Period: ${rentPeriod}`);
    doc.text(`Amount Paid: ${formatAmount(payment.amount)}`);
    doc.text("Payment Status: PAID");

    doc.moveDown(2);

    doc
      .fontSize(12)
      .fillColor("#171717")
      .text("Thank you for your payment.", {
        align: "center",
      });

    doc
      .moveDown(0.5)
      .fontSize(9)
      .fillColor("#777777")
      .text("Generated by RentGuard.", {
        align: "center",
      });

    // Finish generating the PDF
    doc.end();
  } catch (error) {
    console.error("Download payment receipt error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Failed to generate payment receipt.",
      });
    }

    res.destroy(error);
  }
};