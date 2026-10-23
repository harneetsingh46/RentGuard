import { Property } from "../models/property.model.js";
import { Unit } from "../models/unit.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Rent } from "../models/rent.model.js";
import { Payment } from "../models/payment.model.js";

export const getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user._id;

    // 1. Get all properties belonging to this owner
    const properties = await Property.find({ owner: ownerId }).select("_id");

    const propertyIds = properties.map((property) => property._id);

    // 2. Calculate property and unit statistics
    const [
      totalUnits,
      occupiedUnits,
      availableUnits,
      maintenanceUnits,
      activeTenants,
      recentTenants,
      rents,
      recentPayments,
    ] = await Promise.all([
      Unit.countDocuments({ property: { $in: propertyIds } }),

      Unit.countDocuments({
        property: { $in: propertyIds },
        status: "occupied",
      }),

      Unit.countDocuments({
        property: { $in: propertyIds },
        status: "available",
      }),

      Unit.countDocuments({
        property: { $in: propertyIds },
        status: "maintenance",
      }),

      Tenant.countDocuments({
        property: { $in: propertyIds },
        isActive: true,
      }),

      Tenant.find({
        property: { $in: propertyIds },
        isActive: true,
      })
        .populate("property", "propertyName")
        .populate("unit", "unitName")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Rent.find({
        property: { $in: propertyIds },
      }).lean(),

      Payment.find({
        property: { $in: propertyIds },
        status: "paid",
      })
        .populate("tenant", "fullName")
        .populate("unit", "unitName")
        .populate("property", "propertyName")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // 3. Calculate rent statistics
    const now = new Date();

    const rentOverview = rents.reduce(
      (totals, rent) => {
        const amount = Number(rent.amount) || 0;
        const paidAmount = Number(rent.paidAmount) || 0;
        const remainingAmount = Math.max(0, amount - paidAmount);

        totals.totalRent += amount;
        totals.collectedRent += Math.min(amount, paidAmount);

        if (remainingAmount > 0) {
          if (new Date(rent.dueDate) < now) {
            totals.overdueRent += remainingAmount;
          } else {
            totals.pendingRent += remainingAmount;
          }
        }

        return totals;
      },
      {
        totalRent: 0,
        collectedRent: 0,
        pendingRent: 0,
        overdueRent: 0,
      },
    );

    // 4. Return dashboard data
    return res.status(200).json({
      message: "Owner dashboard fetched successfully",
      data: {
        overview: {
          totalProperties: properties.length,
          totalUnits,
          occupiedUnits,
          availableUnits,
          maintenanceUnits,
          activeTenants,
        },
        rentOverview,
        recentTenants,
        recentPayments,
      },
    });
  } catch (error) {
    console.error("Owner dashboard error:", error);

    return res.status(500).json({
      message: "Failed to fetch owner dashboard",
    });
  }
};
