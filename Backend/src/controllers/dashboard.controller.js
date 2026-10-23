import { Property } from "../models/property.model.js";
import { Unit } from "../models/unit.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Rent } from "../models/rent.model.js";
import { Payment } from "../models/payment.model.js";

export const getOwnerDashboard = async (req, res) => {
  try {
    // 1. Get the logged-in owner's ID
    const ownerId = req.user._id;

    // 2. Get the selected month and year
    // If they are not provided, use the current month and year
    const currentDate = new Date();

    let selectedMonth = Number(req.query.month);
    let selectedYear = Number(req.query.year);

    if (!req.query.month) {
      selectedMonth = currentDate.getMonth() + 1;
    }

    if (!req.query.year) {
      selectedYear = currentDate.getFullYear();
    }

    // 3. Validate the selected month and year
    if (
      !Number.isInteger(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      return res.status(400).json({
        message: "Month must be a number between 1 and 12.",
      });
    }

    if (
      !Number.isInteger(selectedYear) ||
      selectedYear < 2000 ||
      selectedYear > 2100
    ) {
      return res.status(400).json({
        message: "Please provide a valid year between 2000 and 2100.",
      });
    }

    // 4. Get all properties owned by this owner

    const properties = await Property.find({
      owner: ownerId,
    }).select("_id");

    const propertyIds = [];

    for (const property of properties) {
      propertyIds.push(property._id);
    }

    // 5. Calculate property and unit statistics

    const totalProperties = properties.length;

    const totalUnits = await Unit.countDocuments({
      property: { $in: propertyIds },
    });

    const occupiedUnits = await Unit.countDocuments({
      property: { $in: propertyIds },
      status: "occupied",
    });

    const availableUnits = await Unit.countDocuments({
      property: { $in: propertyIds },
      status: "available",
    });

    const maintenanceUnits = await Unit.countDocuments({
      property: { $in: propertyIds },
      status: "maintenance",
    });

    const activeTenants = await Tenant.countDocuments({
      property: { $in: propertyIds },
      isActive: true,
    });

    // 6. Get rent records for the selected month

    const rents = await Rent.find({
      property: { $in: propertyIds },
      month: selectedMonth,
      year: selectedYear,
    });

    // Variables for financial calculations
    let totalRent = 0;
    let collectedRent = 0;
    let pendingRent = 0;
    let overdueRent = 0;

    // Calculate the totals for the selected month
    for (const rent of rents) {
      const rentAmount = Number(rent.amount) || 0;
      const paidAmount = Number(rent.paidAmount) || 0;

      // Do not count a negative remaining balance
      let remainingAmount = rentAmount - paidAmount;

      if (remainingAmount < 0) {
        remainingAmount = 0;
      }

      // Total rent for the selected month
      totalRent = totalRent + rentAmount;

      // Amount collected toward this month's rent
      let amountToCountAsCollected = paidAmount;

      if (amountToCountAsCollected > rentAmount) {
        amountToCountAsCollected = rentAmount;
      }

      if (amountToCountAsCollected < 0) {
        amountToCountAsCollected = 0;
      }

      collectedRent = collectedRent + amountToCountAsCollected;

      // Check whether the remaining rent is overdue
      if (remainingAmount > 0) {
        const dueDate = new Date(rent.dueDate);

        // Treat the due date as valid through the end of that day
        dueDate.setHours(23, 59, 59, 999);

        if (dueDate < currentDate) {
          overdueRent = overdueRent + remainingAmount;
        } else {
          pendingRent = pendingRent + remainingAmount;
        }
      }
    }

    // 7. Get the five most recent active tenants

    const recentTenants = await Tenant.find({
      property: { $in: propertyIds },
      isActive: true,
    })
      .populate("property", "propertyName")
      .populate("unit", "unitName")
      .sort({ createdAt: -1 })
      .limit(5);

    // 8. Get payments linked to this month's rents

    const rentIds = [];

    for (const rent of rents) {
      rentIds.push(rent._id);
    }

    const recentPayments = await Payment.find({
      property: { $in: propertyIds },
      rent: { $in: rentIds },
      status: "paid",
    })
      .populate("tenant", "fullName")
      .populate("property", "propertyName")
      .populate("unit", "unitName")
      .sort({ createdAt: -1 })
      .limit(5);

    // 9. Send the dashboard data

    return res.status(200).json({
      message: "Owner dashboard fetched successfully",

      data: {
        selectedPeriod: {
          month: selectedMonth,
          year: selectedYear,
        },

        overview: {
          totalProperties,
          totalUnits,
          occupiedUnits,
          availableUnits,
          maintenanceUnits,
          activeTenants,
        },

        rentOverview: {
          totalRent,
          collectedRent,
          pendingRent,
          overdueRent,
        },

        recentTenants,
        recentPayments,
      },
    });
  } catch (error) {
    console.error("Owner dashboard error:", error);

    return res.status(500).json({
      message: "Failed to fetch owner dashboard.",
    });
  }
}