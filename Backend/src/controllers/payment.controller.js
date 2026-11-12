import mongoose from "mongoose";
import crypto from "crypto";
import PDFDocument from "pdfkit";

import { Payment } from "../models/payment.model.js";
import { Order } from "../models/order.model.js";
import { Bill } from "../models/bill.model.js";
import { Property } from "../models/property.model.js";

import razorpay from "../utils/razorpay.js";

import {
  checkCapturedPayment,
  settleCapturedPayment,
  sendPaidEmails,
} from "../utils/paymentSettlement.js";

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

    if (payment.status === "needs_refund") {
      return res.status(409).json({
        success: false,
        code: "PAYMENT_REQUIRES_REFUND",
        message:
          "Payment was received, but its bill reservation is no longer active. Please contact support for a refund.",
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

    // Verify Razorpay Checkout signature.
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

    // Confirm the captured payment directly with Razorpay.
    const check = await checkCapturedPayment(payment, razorpay_payment_id);

    if (!check.ok) {
      return res.status(400).json({
        success: false,
        message: check.reason || "Payment could not be verified.",
      });
    }

    // Browser verification and webhook use the same settlement function.
    const outcome = await settleCapturedPayment({
      paymentId: payment._id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (outcome === "needs_refund") {
      return res.status(409).json({
        success: false,
        code: "PAYMENT_REQUIRES_REFUND",
        message:
          "Payment was received, but the order or bill reservation is no longer active. Please contact support for a refund.",
      });
    }

    // Send confirmation emails only after successful settlement.
    if (outcome === "paid") {
      await sendPaidEmails(payment._id);
    }

    const [updatedPayment, updatedOrder] = await Promise.all([
      Payment.findById(payment._id),
      Order.findById(payment.order),
    ]);

    return res.status(200).json({
      success: true,
      message:
        outcome === "already_paid"
          ? "Payment already verified."
          : "Payment verified successfully.",
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

// SHARED: GENERATE MINIMAL TABLE-STYLE PAYMENT RECEIPT PDF

const generatePaymentReceipt = (res, payment, property) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    bufferPages: true,
    info: {
      Title: "RentGuard Payment Receipt",
      Author: "RentGuard",
    },
  });

  const receiptNumber = `RG-${payment._id.toString().slice(-8).toUpperCase()}`;

  const paymentDate = new Date(
    payment.paidAt || payment.updatedAt || payment.createdAt,
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

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-IN") : "N/A";

  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const left = doc.page.margins.left;
  const right = left + pageWidth;

  const borderColor = "#777777";
  const textColor = "#171717";
  const labelColor = "#444444";

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="RentGuard-Receipt-${receiptNumber}.pdf"`,
  );

  doc.pipe(res);

  // BASIC TABLE HELPERS

  const checkPageSpace = (height) => {
    if (doc.y + height > doc.page.height - 50) {
      doc.addPage();
    }
  };

  const drawSectionTitle = (title) => {
    checkPageSpace(35);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(textColor)
      .text(title.toUpperCase(), left, doc.y);

    doc.moveDown(0.5);
  };

  const drawTable = (rows, columnWidths, options = {}) => {
    const padding = 7;
    const fontSize = options.fontSize || 9;
    const headerRows = options.headerRows || 0;

    rows.forEach((row, rowIndex) => {
      const isHeader = rowIndex < headerRows;

      doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize);

      const rowHeight = Math.max(
        27,
        ...row.map((cell, columnIndex) => {
          const text =
            cell === null || cell === undefined ? "N/A" : String(cell);

          return (
            doc.heightOfString(text, {
              width: columnWidths[columnIndex] - padding * 2,
              fontSize,
              lineGap: 1,
            }) +
            padding * 2
          );
        }),
      );

      checkPageSpace(rowHeight + 2);

      const rowY = doc.y;
      let cellX = left;

      row.forEach((cell, columnIndex) => {
        const cellWidth = columnWidths[columnIndex];

        // Simple table borders.
        doc
          .lineWidth(0.5)
          .strokeColor(borderColor)
          .rect(cellX, rowY, cellWidth, rowHeight)
          .stroke();

        const text = cell === null || cell === undefined ? "N/A" : String(cell);

        doc
          .font(isHeader ? "Helvetica-Bold" : "Helvetica")
          .fontSize(fontSize)
          .fillColor(isHeader ? textColor : labelColor)
          .text(text, cellX + padding, rowY + padding, {
            width: cellWidth - padding * 2,
            height: rowHeight - padding * 2,
            lineGap: 1,
            ellipsis: false,
          });

        cellX += cellWidth;
      });

      doc.y = rowY + rowHeight;
    });
  };

  const drawDetailsTable = (rows) => {
    drawTable(
      [["Field", "Details"], ...rows],
      [pageWidth * 0.32, pageWidth * 0.68],
      { headerRows: 1 },
    );
  };

  // RECEIPT HEADER

  doc
    .font("Helvetica-Bold")
    .fontSize(19)
    .fillColor(textColor)
    .text("RentGuard", left, 45, {
      width: pageWidth / 2,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(textColor)
    .text("PAYMENT RECEIPT", left + pageWidth / 2, 48, {
      width: pageWidth / 2,
      align: "right",
    });

  doc
    .moveTo(left, 80)
    .lineTo(right, 80)
    .lineWidth(0.8)
    .strokeColor(textColor)
    .stroke();

  doc.y = 95;

  // RECEIPT INFORMATION

  drawSectionTitle("Receipt Information");

  drawTable(
    [
      ["Receipt Number", "Payment Date", "Payment ID"],
      [receiptNumber, formattedDate, payment.razorpayPaymentId || "N/A"],
    ],
    [pageWidth * 0.3, pageWidth * 0.3, pageWidth * 0.4],
    { headerRows: 1 },
  );

  doc.moveDown(1);

  // PROPERTY DETAILS

  drawSectionTitle("Property Details");

  drawDetailsTable([
    ["Property", property.propertyName || "N/A"],
    ["Address", property.address || "N/A"],
    ["Unit", payment.unit?.unitName || "N/A"],
  ]);

  doc.moveDown(1);

  // TENANT DETAILS

  drawSectionTitle("Tenant Details");

  drawDetailsTable([
    ["Tenant Name", payment.tenant?.fullName || "N/A"],
    ["Tenant Email", payment.tenant?.email || "N/A"],
  ]);

  doc.moveDown(1);

  // BILL DETAILS

  drawSectionTitle("Bill Details");

  const billRows = [["Description", "Billing Period", "Due Date", "Amount"]];

  payment.order?.items?.forEach((item) => {
    const bill = item.bill;

    if (!bill) return;

    billRows.push([
      `${bill.billName || "N/A"} (${bill.category || "N/A"})`,
      bill.month && bill.year ? `${bill.month}/${bill.year}` : "N/A",
      formatDate(bill.dueDate),
      formatAmount(item.amount),
    ]);
  });

  if (billRows.length === 1) {
    billRows.push(["No bill details", "N/A", "N/A", "N/A"]);
  }

  drawTable(
    billRows,
    [pageWidth * 0.37, pageWidth * 0.19, pageWidth * 0.19, pageWidth * 0.25],
    { headerRows: 1, fontSize: 8.5 },
  );

  doc.moveDown(1);

  // TOTAL AMOUNT

  checkPageSpace(65);

  const finalY = doc.y + 5;

  doc
    .moveTo(left, finalY)
    .lineTo(right, finalY)
    .lineWidth(0.8)
    .strokeColor(textColor)
    .stroke();

  doc.y = finalY + 12;

  const totalY = doc.y;

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(textColor)
    .text("Total Amount Paid", left, totalY, {
      width: pageWidth * 0.55,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(textColor)
    .text(formatAmount(payment.amount), left, totalY, {
      width: pageWidth,
      align: "right",
    });

  doc.y = totalY + 22;

  doc
    .moveTo(left, doc.y)
    .lineTo(right, doc.y)
    .lineWidth(0.8)
    .strokeColor(textColor)
    .stroke();

  doc.moveDown(0.7);

  // PAYMENT STATUS

  drawTable([["Payment Status", "PAID"]], [pageWidth * 0.5, pageWidth * 0.5]);

  doc.moveDown(2);

  // FOOTER

  checkPageSpace(45);

  doc
    .moveTo(left, doc.y)
    .lineTo(right, doc.y)
    .lineWidth(0.5)
    .strokeColor(borderColor)
    .stroke();

  doc.moveDown(1);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(textColor)
    .text("Thank you for your payment.", {
      align: "center",
    });

  doc.moveDown(0.4);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(labelColor)
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

// 7. OWNER: DOWNLOAD RECEIPT BY BILL ID

export const downloadBillReceipt = async (req, res) => {
  try {
    if (req.authRole !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only owners can download payment receipts.",
      });
    }

    const { propertyId, billId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(propertyId) ||
      !mongoose.Types.ObjectId.isValid(billId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid property or bill ID.",
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

    const bill = await Bill.findOne({
      _id: billId,
      property: propertyId,
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found.",
      });
    }

    if (bill.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message:
          "This bill has not been paid yet. Receipts are only available for paid bills.",
      });
    }

    // Find the paid payment associated with this bill.
    let payment = null;

    if (bill.reservedByOrder) {
      payment = await Payment.findOne({
        order: bill.reservedByOrder,
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
    }

    if (!payment) {
      const order = await Order.findOne({
        "items.bill": bill._id,
        status: "paid",
      });

      if (order) {
        payment = await Payment.findOne({
          order: order._id,
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
      }
    }

    if (!payment || !payment.order) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found for this bill.",
      });
    }

    return generatePaymentReceipt(res, payment, property);
  } catch (error) {
    console.error("Download bill receipt error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate payment receipt.",
      });
    }

    res.destroy(error);
  }
};

// 7. RAZORPAY WEBHOOK
// This handler is called directly by Razorpay, not by a logged-in tenant.

export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured.");
      return res.status(500).json({
        success: false,
        message: "Webhook is not configured.",
      });
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Webhook raw body is missing.",
      });
    }

    const receivedSignature = req.headers["x-razorpay-signature"];

    if (typeof receivedSignature !== "string" || !receivedSignature) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature is missing.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(receivedSignature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    const eventPayload = JSON.parse(req.body.toString("utf8"));
    const event = eventPayload.event;

    // Ignore events that are not payment capture events.
    if (!["payment.captured", "order.paid"].includes(event)) {
      return res.status(200).json({
        success: true,
        message: "Webhook event ignored.",
      });
    }

    const razorpayPayment = eventPayload.payload?.payment?.entity;

    if (!razorpayPayment?.id || !razorpayPayment?.order_id) {
      console.error("Webhook payment details are missing.");
      return res.status(200).json({
        success: true,
        message: "No payment details to process.",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpayPayment.order_id,
    });

    if (!payment) {
      console.error(
        "Webhook received for an unknown Razorpay order:",
        razorpayPayment.order_id,
      );

      return res.status(200).json({
        success: true,
        message: "Payment record not found; event logged.",
      });
    }

    if (payment.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already settled.",
      });
    }

    if (payment.status === "needs_refund") {
      return res.status(200).json({
        success: true,
        message: "Payment is already flagged for refund.",
      });
    }

    // Verify captured amount, currency and order directly with Razorpay.
    const check = await checkCapturedPayment(payment, razorpayPayment.id);

    if (!check.ok) {
      console.error("Webhook payment verification failed:", check.reason);

      // A 200 response prevents endless retries for an invalid capture.
      return res.status(200).json({
        success: true,
        message: "Payment did not pass verification.",
      });
    }

    const outcome = await settleCapturedPayment({
      paymentId: payment._id,
      razorpayPaymentId: razorpayPayment.id,
    });

    if (outcome === "paid") {
      await sendPaidEmails(payment._id);
    }

    if (outcome === "needs_refund") {
      console.error(
        "Captured payment requires refund/reconciliation:",
        payment._id.toString(),
      );
    }

    return res.status(200).json({
      success: true,
      message: `Webhook processed: ${outcome}`,
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error);

    // Return 500 for unexpected/transient errors so Razorpay can retry.
    return res.status(500).json({
      success: false,
      message: "Webhook processing failed.",
    });
  }
};
