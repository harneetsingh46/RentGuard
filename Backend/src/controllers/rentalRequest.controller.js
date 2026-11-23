import mongoose from "mongoose";
import { RentalRequest } from "../models/rentalRequest.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Unit } from "../models/unit.model.js";
import { Property } from "../models/property.model.js";
import { sendRentalApplicationNotification } from "../utils/email.js";
import { expireStaleMoveOut } from "../utils/moveOut.js";

// Helper to mask Aadhaar in responses
const maskAadhaar = (aadhaarNumber) => {
  if (!aadhaarNumber) return "";
  const value = String(aadhaarNumber);
  return `XXXX-XXXX-${value.slice(-4)}`;
};

// 1. TENANT: CREATE A RENTAL REQUEST FOR AN AVAILABLE UNIT
export const createRentalRequest = async (req, res) => {
  try {
    const { unitId, message, moveInDate } = req.body;

    if (!unitId || !mongoose.isValidObjectId(unitId)) {
      return res.status(400).json({
        message: "A valid unit ID is required.",
      });
    }

    await expireStaleMoveOut(req.user._id);

    const tenant = await Tenant.findById(req.user._id);
    if (!tenant || !tenant.isActive) {
      return res.status(403).json({
        message: "Active tenant account not found.",
      });
    }

    // Active tenant with a unit may apply ONLY if moveOutRequest.status is "pending" and expiresAt > now
    if (tenant.unit && tenant.isActive) {
      if (tenant.unit.toString() === unitId.toString()) {
        return res.status(400).json({
          message: "You cannot apply to the unit you currently occupy.",
        });
      }

      const isMoveOutPending =
        tenant.moveOutRequest?.status === "pending" &&
        tenant.moveOutRequest?.expiresAt &&
        new Date(tenant.moveOutRequest.expiresAt) > new Date();

      if (!isMoveOutPending) {
        return res.status(400).json({
          message:
            "To apply for another property, first submit a move-out request for your current unit.",
        });
      }
    }

    // Verify unit exists and load its owner for the notification.
    const unit = await Unit.findById(unitId).populate({
      path: "property",
      populate: { path: "owner", select: "username email" },
    });
    if (!unit) {
      return res.status(404).json({
        message: "Unit not found.",
      });
    }

    if (unit.status !== "available") {
      return res.status(400).json({
        message: `This unit is currently ${unit.status} and cannot be rented.`,
      });
    }

    if (!unit.property) {
      return res.status(400).json({
        message: "Unit is not linked to a valid property.",
      });
    }

    // Check if tenant already has an active pending/approved request for this unit
    const existing = await RentalRequest.findOne({
      tenant: tenant._id,
      unit: unit._id,
      status: { $in: ["Pending", "Approved"] },
    });

    if (existing) {
      return res.status(409).json({
        message: "You already have an active request for this unit.",
      });
    }

    let parsedMoveInDate = null;
    if (moveInDate) {
      const parsed = new Date(moveInDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: "Please provide a valid move-in date." });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (typeof moveInDate === "string" && /^\d{4}-\d{2}-\d{2}/.test(moveInDate)) {
        const [y, m, d] = moveInDate.split("T")[0].split("-").map(Number);
        const checkDate = new Date(y, m - 1, d);
        if (checkDate < today) {
          return res.status(400).json({ message: "Move-in date cannot be in the past." });
        }
      } else {
        const checkDate = new Date(parsed);
        checkDate.setHours(0, 0, 0, 0);
        if (checkDate < today) {
          return res.status(400).json({ message: "Move-in date cannot be in the past." });
        }
      }

      parsedMoveInDate = parsed;
    }

    const request = await RentalRequest.create({
      tenant: tenant._id,
      owner: unit.property.owner._id,
      property: unit.property._id,
      unit: unit._id,
      moveInDate: parsedMoveInDate,
      message: (message || "").trim(),
      status: "Pending",
    });

    await sendRentalApplicationNotification({
      event: "submitted",
      tenantEmail: tenant.email,
      tenantName: tenant.fullName,
      ownerEmail: unit.property.owner.email,
      ownerName: unit.property.owner.username,
      propertyName: unit.property.propertyName,
      propertyAddress: unit.property.address,
      unitName: unit.unitName,
      rent: unit.rent,
      moveInDate: parsedMoveInDate,
      message: request.message,
    });

    return res.status(201).json({
      message: "Rental request submitted successfully. Email notifications were attempted.",
      data: request,
    });
  } catch (error) {
    console.error("Create rental request error:", error);
    return res.status(500).json({
      message: error.message || "Failed to submit rental request.",
    });
  }
};

// 2. TENANT: GET ALL MY RENTAL REQUESTS
export const getMyRentalRequests = async (req, res) => {
  try {
    await expireStaleMoveOut(req.user._id);

    const requests = await RentalRequest.find({ tenant: req.user._id })
      .populate("property", "propertyName address")
      .populate("unit", "unitName unitType rent status")
      .populate("owner", "username email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Rental requests fetched successfully.",
      data: requests,
    });
  } catch (error) {
    console.error("Get my rental requests error:", error);
    return res.status(500).json({
      message: "Failed to fetch rental requests.",
    });
  }
};

// 3. TENANT: CANCEL A PENDING OR APPROVED REQUEST
export const cancelMyRentalRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await RentalRequest.findOne({
      _id: id,
      tenant: req.user._id,
    });

    if (!request) {
      return res.status(404).json({
        message: "Rental request not found.",
      });
    }

    if (!["Pending", "Approved"].includes(request.status)) {
      return res.status(400).json({
        message: `Cannot cancel a request that is already ${request.status}.`,
      });
    }

    request.status = "Cancelled";
    request.rejectionReason = "Cancelled by applicant.";
    await request.save();

    const populated = await RentalRequest.findById(request._id)
      .populate("tenant", "fullName email")
      .populate("owner", "username email")
      .populate("property", "propertyName address")
      .populate("unit", "unitName rent");

    await sendRentalApplicationNotification({
      event: "cancelled",
      tenantEmail: populated.tenant?.email,
      tenantName: populated.tenant?.fullName,
      ownerEmail: populated.owner?.email,
      ownerName: populated.owner?.username,
      propertyName: populated.property?.propertyName,
      propertyAddress: populated.property?.address,
      unitName: populated.unit?.unitName,
      rent: populated.unit?.rent,
      moveInDate: populated.moveInDate,
    });

    return res.status(200).json({
      message: "Rental request cancelled successfully. An email notification was attempted.",
      data: populated,
    });
  } catch (error) {
    console.error("Cancel rental request error:", error);
    return res.status(500).json({
      message: "Failed to cancel rental request.",
    });
  }
};

// 4. OWNER: GET ALL INCOMING RENTAL REQUESTS
export const getOwnerRentalRequests = async (req, res) => {
  try {
    const requests = await RentalRequest.find({ owner: req.user._id })
      .populate("tenant", "fullName email phone aadhaarNumber address")
      .populate("property", "propertyName address")
      .populate("unit", "unitName unitType rent status")
      .sort({ createdAt: -1 });

    // Mask Aadhaar on returned applicants
    const safeRequests = requests.map((item) => {
      const obj = item.toObject();
      if (obj.tenant && obj.tenant.aadhaarNumber) {
        obj.tenant.aadhaarNumber = maskAadhaar(obj.tenant.aadhaarNumber);
      }
      return obj;
    });

    return res.status(200).json({
      message: "Incoming rental requests fetched successfully.",
      data: safeRequests,
    });
  } catch (error) {
    console.error("Get owner rental requests error:", error);
    return res.status(500).json({
      message: "Failed to fetch rental requests.",
    });
  }
};

// 5. OWNER: APPROVE A RENTAL REQUEST (Awaiting Tenant Confirmation)
export const approveRentalRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await RentalRequest.findOne({
      _id: id,
      owner: req.user._id,
    }).populate("unit");

    if (!request) {
      return res.status(404).json({
        message: "Rental request not found.",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        message: `Only pending requests can be approved. Current status: ${request.status}`,
      });
    }

    if (!request.unit || request.unit.status !== "available") {
      return res.status(400).json({
        message: "This unit is no longer available.",
      });
    }

    request.status = "Approved";
    await request.save();

    const populated = await RentalRequest.findById(request._id)
      .populate("tenant", "fullName email")
      .populate("property", "propertyName address")
      .populate("unit", "unitName rent");

    await sendRentalApplicationNotification({
      event: "approved",
      tenantEmail: populated.tenant?.email,
      tenantName: populated.tenant?.fullName,
      ownerEmail: req.user.email,
      ownerName: req.user.username,
      propertyName: populated.property?.propertyName,
      propertyAddress: populated.property?.address,
      unitName: populated.unit?.unitName,
      rent: populated.unit?.rent,
      moveInDate: populated.moveInDate,
      message: populated.message,
    });

    return res.status(200).json({
      message: "Rental request approved. An email notification was attempted; the tenant must confirm the offer.",
      data: populated,
    });
  } catch (error) {
    console.error("Approve rental request error:", error);
    return res.status(500).json({
      message: "Failed to approve rental request.",
    });
  }
};

// 6. OWNER: REJECT A RENTAL REQUEST
export const rejectRentalRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const request = await RentalRequest.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!request) {
      return res.status(404).json({
        message: "Rental request not found.",
      });
    }

    if (["Accepted", "Rejected", "Cancelled"].includes(request.status)) {
      return res.status(400).json({
        message: `Cannot reject a request that is ${request.status}.`,
      });
    }

    request.status = "Rejected";
    request.rejectionReason = rejectionReason?.trim() || "Application declined by property owner.";
    await request.save();

    const populated = await RentalRequest.findById(request._id)
      .populate("tenant", "fullName email")
      .populate("property", "propertyName address")
      .populate("unit", "unitName rent");

    await sendRentalApplicationNotification({
      event: "rejected",
      tenantEmail: populated.tenant?.email,
      tenantName: populated.tenant?.fullName,
      ownerEmail: req.user.email,
      ownerName: req.user.username,
      propertyName: populated.property?.propertyName,
      propertyAddress: populated.property?.address,
      unitName: populated.unit?.unitName,
      rent: populated.unit?.rent,
      moveInDate: populated.moveInDate,
      message: populated.message,
      rejectionReason: populated.rejectionReason,
    });

    return res.status(200).json({
      message: "Rental request rejected. An email notification was attempted.",
      data: populated,
    });
  } catch (error) {
    console.error("Reject rental request error:", error);
    return res.status(500).json({
      message: "Failed to reject rental request.",
    });
  }
};

// 7. TENANT: CONFIRM & ACCEPT APPROVED LEASE
// (Activates tenancy, occupies unit, and cancels all other applications)
export const acceptApprovedRentalRequest = async (req, res) => {
  const session = await mongoose.startSession();
  let acceptedDetails = null;

  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid rental request ID." });
    }

    await expireStaleMoveOut(req.user._id);

    await session.withTransaction(async () => {
      const request = await RentalRequest.findOne({
        _id: id,
        tenant: req.user._id,
        status: "Approved",
      }).session(session);

      if (!request) {
        const error = new Error("Approved rental request not found.");
        error.statusCode = 404;
        throw error;
      }

      const tenant = await Tenant.findOne({
        _id: req.user._id,
        isActive: true,
      }).session(session);

      if (!tenant) {
        const error = new Error("Active tenant account not found.");
        error.statusCode = 404;
        throw error;
      }

      if (tenant.unit) {
        const error = new Error(
          "Your current owner must approve your move-out before you can confirm this lease.",
        );
        error.statusCode = 409;
        throw error;
      }

      // Atomic claim prevents two applicants accepting the same unit concurrently.
      const unit = await Unit.findOneAndUpdate(
        { _id: request.unit, property: request.property, status: "available" },
        { $set: { status: "occupied" } },
        { new: true, runValidators: true, session },
      );

      if (!unit) {
        const error = new Error("This unit is no longer available.");
        error.statusCode = 409;
        throw error;
      }

      tenant.owner = request.owner;
      tenant.property = request.property;
      tenant.unit = request.unit;
      tenant.isActive = true;
      tenant.moveInDate = request.moveInDate || new Date();
      tenant.moveOutDate = null;
      await tenant.save({ session });

      request.status = "Accepted";
      await request.save({ session });

      await RentalRequest.updateMany(
        {
          tenant: tenant._id,
          _id: { $ne: request._id },
          status: { $in: ["Pending", "Approved"] },
        },
        {
          $set: {
            status: "Cancelled",
            rejectionReason: "You accepted another rental offer.",
          },
        },
        { session },
      );

      await RentalRequest.updateMany(
        {
          unit: request.unit,
          _id: { $ne: request._id },
          status: { $in: ["Pending", "Approved"] },
        },
        {
          $set: {
            status: "Rejected",
            rejectionReason: "Unit was leased to another applicant.",
          },
        },
        { session },
      );

      acceptedDetails = {
        tenantId: tenant._id,
        requestId: request._id,
        ownerId: request.owner,
        propertyId: request.property,
        unitId: request.unit,
        moveInDate: tenant.moveInDate,
      };
    });

    const [tenant, owner, property, unit] = await Promise.all([
      Tenant.findById(acceptedDetails.tenantId).select("fullName email"),
      mongoose.model("User").findById(acceptedDetails.ownerId).select("username email"),
      Property.findById(acceptedDetails.propertyId).select("propertyName address"),
      Unit.findById(acceptedDetails.unitId).select("unitName rent"),
    ]);

    await sendRentalApplicationNotification({
      event: "accepted",
      tenantEmail: tenant?.email,
      tenantName: tenant?.fullName,
      ownerEmail: owner?.email,
      ownerName: owner?.username,
      propertyName: property?.propertyName,
      propertyAddress: property?.address,
      unitName: unit?.unitName,
      rent: unit?.rent,
      moveInDate: acceptedDetails.moveInDate,
    });

    return res.status(200).json({
      message: "Congratulations! Lease accepted and your tenancy is now active.",
      data: {
        tenantId: acceptedDetails.tenantId,
        propertyId: acceptedDetails.propertyId,
        unitId: acceptedDetails.unitId,
        isActive: true,
      },
    });
  } catch (error) {
    console.error("Accept rental request error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to accept rental offer.",
    });
  } finally {
    await session.endSession();
  }
};

// 8. TENANT: DECLINE AN APPROVED OFFER
export const declineApprovedRentalRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await RentalRequest.findOne({
      _id: id,
      tenant: req.user._id,
    });

    if (!request) {
      return res.status(404).json({
        message: "Rental request not found.",
      });
    }

    if (request.status !== "Approved") {
      return res.status(400).json({
        message: `Only approved offers can be declined. Current status: ${request.status}`,
      });
    }

    request.status = "Cancelled";
    request.rejectionReason = "Offer declined by applicant.";
    await request.save();

    const populated = await RentalRequest.findById(request._id)
      .populate("tenant", "fullName email")
      .populate("property", "propertyName address")
      .populate("unit", "unitName rent");

    await sendRentalApplicationNotification({
      event: "declined",
      tenantEmail: populated.tenant?.email,
      tenantName: populated.tenant?.fullName,
      ownerEmail: req.user.email,
      ownerName: req.user.username,
      propertyName: populated.property?.propertyName,
      propertyAddress: populated.property?.address,
      unitName: populated.unit?.unitName,
      rent: populated.unit?.rent,
      moveInDate: populated.moveInDate,
    });

    return res.status(200).json({
      message: "Offer declined successfully. An email notification was attempted.",
      data: populated,
    });
  } catch (error) {
    console.error("Decline rental request error:", error);
    return res.status(500).json({
      message: "Failed to decline rental offer.",
    });
  }
};

