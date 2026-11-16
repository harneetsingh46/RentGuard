import mongoose from "mongoose";
import { RentalRequest } from "../models/rentalRequest.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Unit } from "../models/unit.model.js";
import { Property } from "../models/property.model.js";

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

    const tenant = req.user;

    // Check if tenant already has an active tenancy with an assigned unit
    if (tenant.unit && tenant.isActive) {
      return res.status(400).json({
        message: "You already have an active tenancy assigned.",
      });
    }

    // Verify unit exists and is available
    const unit = await Unit.findById(unitId).populate("property");
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

    const request = await RentalRequest.create({
      tenant: tenant._id,
      owner: unit.property.owner,
      property: unit.property._id,
      unit: unit._id,
      moveInDate: moveInDate ? new Date(moveInDate) : null,
      message: (message || "").trim(),
      status: "Pending",
    });

    return res.status(201).json({
      message: "Rental request submitted successfully. The property owner has been notified.",
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

    return res.status(200).json({
      message: "Rental request cancelled successfully.",
      data: request,
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

    return res.status(200).json({
      message: "Rental request approved. Waiting for tenant to confirm & accept the lease.",
      data: request,
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

    return res.status(200).json({
      message: "Rental request rejected.",
      data: request,
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
        message: `This request cannot be accepted. Current status: ${request.status}`,
      });
    }

    const unit = await Unit.findById(request.unit);
    if (!unit || unit.status === "occupied") {
      return res.status(400).json({
        message: "This unit has already been occupied.",
      });
    }

    // 1. Assign tenant to unit, property & owner
    const tenant = req.user;
    tenant.owner = request.owner;
    tenant.property = request.property;
    tenant.unit = request.unit;
    tenant.isActive = true;
    if (request.moveInDate) {
      tenant.moveInDate = request.moveInDate;
    }
    await tenant.save();

    // 2. Mark unit as occupied
    unit.status = "occupied";
    await unit.save();

    // 3. Mark this request as accepted
    request.status = "Accepted";
    await request.save();

    // 4. Immediately cancel all other pending or approved requests for this tenant
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
      }
    );

    // 5. Reject any other pending requests for this newly occupied unit
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
      }
    );

    return res.status(200).json({
      message: "Congratulations! Lease accepted and your tenancy is now active.",
      data: {
        tenantId: tenant._id,
        propertyId: tenant.property,
        unitId: tenant.unit,
        isActive: tenant.isActive,
      },
    });
  } catch (error) {
    console.error("Accept rental request error:", error);
    return res.status(500).json({
      message: error.message || "Failed to accept rental offer.",
    });
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

    return res.status(200).json({
      message: "Offer declined successfully.",
      data: request,
    });
  } catch (error) {
    console.error("Decline rental request error:", error);
    return res.status(500).json({
      message: "Failed to decline rental offer.",
    });
  }
};

