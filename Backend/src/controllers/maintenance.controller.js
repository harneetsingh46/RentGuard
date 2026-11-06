import { Maintenance } from "../models/maintenance.model.js";
import { User } from "../models/user.model.js";
import { Property } from "../models/property.model.js";
import { Unit } from "../models/unit.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import { sendMaintenanceEmail } from "../utils/email.js";

// 1. Create a maintenance complaint (Tenant only)
export const createComplaint = async (req, res) => {
  try {
    const { title, category, priority, description } = req.body;

    // Validate required fields
    if (!title || !category || !description) {
      return res.status(400).json({
        message: "Title, category, and description are required.",
      });
    }

    const tenant = req.user;

    // Verify tenant has owner, property and unit assigned
    if (!tenant.owner || !tenant.property || !tenant.unit) {
      return res.status(400).json({
        message: "You must be assigned to an active property and unit to submit complaints.",
      });
    }

    // Handle optional image upload to Cloudinary
    let imageUrl = "";
    let cloudinaryPublicId = "";

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: "rentguard/maintenance",
      });

      imageUrl = uploadResult.secure_url;
      cloudinaryPublicId = uploadResult.public_id;
    }

    // Create the complaint in database
    const complaint = await Maintenance.create({
      tenant: tenant._id,
      owner: tenant.owner,
      property: tenant.property,
      unit: tenant.unit,
      title: title.trim(),
      category,
      priority: priority || "Medium",
      description: description.trim(),
      imageUrl,
      cloudinaryPublicId,
      status: "Pending",
    });

    // Notify the owner by email (async, non-blocking)
    User.findById(tenant.owner)
      .select("email username")
      .then(async (owner) => {
        if (!owner?.email) return;

        const [property, unit] = await Promise.all([
          Property.findById(tenant.property).select("propertyName"),
          Unit.findById(tenant.unit).select("unitName"),
        ]);

        sendMaintenanceEmail({
          ownerEmail: owner.email,
          ownerName: owner.username,
          tenantName: tenant.fullName,
          propertyName: property?.propertyName,
          unitName: unit?.unitName,
          title: complaint.title,
          category: complaint.category,
          priority: complaint.priority,
          description: complaint.description,
        });
      })
      .catch((err) => console.error("Error sending owner email notification:", err.message));

    return res.status(201).json({
      message: "Complaint submitted successfully. Your property owner has been notified.",
      data: complaint,
    });
  } catch (error) {
    console.error("Create complaint error:", error);
    return res.status(500).json({
      message: error.message || "Failed to submit complaint.",
    });
  }
};

// 2. Get all complaints submitted by the logged-in tenant
export const getTenantComplaints = async (req, res) => {
  try {
    const complaints = await Maintenance.find({ tenant: req.user._id })
      .populate("property", "propertyName address")
      .populate("unit", "unitName unitType")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Complaints fetched successfully.",
      data: complaints,
    });
  } catch (error) {
    console.error("Get tenant complaints error:", error);
    return res.status(500).json({
      message: "Failed to fetch complaints.",
    });
  }
};

// 3. Get all complaints for the logged-in owner's properties
export const getOwnerComplaints = async (req, res) => {
  try {
    const { status, priority, propertyId } = req.query;

    const query = { owner: req.user._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (propertyId) query.property = propertyId;

    const complaints = await Maintenance.find(query)
      .populate("tenant", "fullName email phone")
      .populate("property", "propertyName address")
      .populate("unit", "unitName unitType")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Owner complaints fetched successfully.",
      data: complaints,
    });
  } catch (error) {
    console.error("Get owner complaints error:", error);
    return res.status(500).json({
      message: "Failed to fetch owner complaints.",
    });
  }
};

// 4. Get single complaint details (viewable by involved tenant or owner)
export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Maintenance.findById(id)
      .populate("tenant", "fullName email phone")
      .populate("property", "propertyName address")
      .populate("unit", "unitName unitType");

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    // Authorization: only the complaint's tenant or owner can view
    const isOwnerUser =
      req.authRole === "owner" &&
      complaint.owner.toString() === req.user._id.toString();

    const isTenantUser =
      req.authRole === "tenant" &&
      complaint.tenant._id.toString() === req.user._id.toString();

    if (!isOwnerUser && !isTenantUser) {
      return res.status(403).json({
        message: "You do not have permission to view this complaint.",
      });
    }

    return res.status(200).json({
      message: "Complaint retrieved successfully.",
      data: complaint,
    });
  } catch (error) {
    console.error("Get complaint by id error:", error);
    return res.status(500).json({
      message: "Failed to fetch complaint details.",
    });
  }
};

// 5. Update complaint status & owner notes (Owner only)
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, ownerNotes } = req.body;

    const validStatuses = ["Pending", "In Progress", "Resolved", "Rejected"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const complaint = await Maintenance.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found or you do not have permission.",
      });
    }

    if (status) complaint.status = status;
    if (ownerNotes !== undefined) complaint.ownerNotes = ownerNotes.trim();

    await complaint.save();

    return res.status(200).json({
      message: "Complaint status updated successfully.",
      data: complaint,
    });
  } catch (error) {
    console.error("Update complaint status error:", error);
    return res.status(500).json({
      message: "Failed to update complaint status.",
    });
  }
};

