import { Property } from "../models/property.model.js";
import { Unit } from "../models/unit.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Bill } from "../models/bill.model.js";
import { Payment } from "../models/payment.model.js";
import { Maintenance } from "../models/maintenance.model.js";

export const getOwnerDashboard = async (req, res) => {
  try {
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only property owners can access this dashboard.",
      });
    }

    const ownerId = req.user._id;
    const now = new Date();

    const selectedMonth = req.query.month
      ? Number(req.query.month)
      : now.getMonth() + 1;

    const selectedYear = req.query.year
      ? Number(req.query.year)
      : now.getFullYear();

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

    // Get all properties belonging to this owner
    const properties = await Property.find({ owner: ownerId })
      .select("_id propertyName address")
      .lean();

    const propertyIds = properties.map((property) => property._id);

    const monthStart = new Date(selectedYear, selectedMonth - 1, 1);

    const nextMonthStart = new Date(selectedYear, selectedMonth, 1);

    // Fetch dashboard information
    const [
      totalUnits,
      occupiedUnits,
      availableUnits,
      maintenanceUnits,
      activeTenants,
      bills,
      collectedPayments,
      recentPayments,
      recentTenants,
      recentBills,
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      rejectedComplaints,
      recentComplaints,
    ] = await Promise.all([
      Unit.countDocuments({
        property: { $in: propertyIds },
      }),

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
        owner: ownerId,
        isActive: true,
      }),

      // Bills for selected month
      Bill.find({
        property: { $in: propertyIds },
        month: selectedMonth,
        year: selectedYear,
      })
        .select(
          "property unit tenant category billName amount month year dueDate paymentStatus paidAt createdAt",
        )
        .lean(),

      // Payments collected during selected calendar month
      Payment.find({
        property: { $in: propertyIds },
        status: "paid",
        paidAt: {
          $gte: monthStart,
          $lt: nextMonthStart,
        },
      })
        .select("amount")
        .lean(),

      // Latest successful payments
      Payment.find({
        property: { $in: propertyIds },
        status: "paid",
      })
        .populate("tenant", "fullName email phone")
        .populate("property", "propertyName")
        .populate("unit", "unitName")
        .populate({
          path: "order",
          populate: {
            path: "items.bill",
            select: "billName category amount month year",
          },
        })
        .sort({ paidAt: -1, createdAt: -1 })
        .limit(5)
        .lean(),

      // Latest active tenants
      Tenant.find({
        owner: ownerId,
        isActive: true,
      })
        .select("fullName email phone property unit createdAt isActive")
        .populate("property", "propertyName")
        .populate("unit", "unitName")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Latest bills for selected month
      Bill.find({
        property: { $in: propertyIds },
        month: selectedMonth,
        year: selectedYear,
      })
        .populate("tenant", "fullName")
        .populate("property", "propertyName")
        .populate("unit", "unitName")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Maintenance statistics
      Maintenance.countDocuments({
        owner: ownerId,
      }),

      Maintenance.countDocuments({
        owner: ownerId,
        status: "Pending",
      }),

      Maintenance.countDocuments({
        owner: ownerId,
        status: "In Progress",
      }),

      Maintenance.countDocuments({
        owner: ownerId,
        status: "Resolved",
      }),

      Maintenance.countDocuments({
        owner: ownerId,
        status: "Rejected",
      }),

      // Latest maintenance complaints
      Maintenance.find({
        owner: ownerId,
      })
        .populate("tenant", "fullName")
        .populate("property", "propertyName")
        .populate("unit", "unitName")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Calculate bill amounts
    let totalBillsAmount = 0;
    let paidBillsAmount = 0;
    let outstandingAmount = 0;
    let overdueAmount = 0;

    let unpaidBills = 0;
    let reservedBills = 0;
    let paidBills = 0;
    let overdueBills = 0;

    for (const bill of bills) {
      const amount = Number(bill.amount) || 0;

      totalBillsAmount += amount;

      if (bill.paymentStatus === "paid") {
        paidBills += 1;
        paidBillsAmount += amount;
        continue;
      }

      outstandingAmount += amount;

      if (bill.paymentStatus === "reserved") {
        reservedBills += 1;
      } else {
        unpaidBills += 1;
      }

      // Check whether unpaid bill is overdue
      if (bill.dueDate) {
        const dueDateEnd = new Date(bill.dueDate);

        dueDateEnd.setHours(23, 59, 59, 999);

        if (dueDateEnd < now) {
          overdueAmount += amount;
          overdueBills += 1;
        }
      }
    }

    // Calculate successful payments received this month
    const collectedThisMonth = collectedPayments.reduce((total, payment) => {
      return total + (Number(payment.amount) || 0);
    }, 0);

    // Calculate occupancy percentage
    const occupancyRate =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    return res.status(200).json({
      message: "Owner dashboard fetched successfully",

      data: {
        selectedPeriod: {
          month: selectedMonth,
          year: selectedYear,
        },

        overview: {
          totalProperties: properties.length,
          totalUnits,
          occupiedUnits,
          availableUnits,
          maintenanceUnits,
          activeTenants,
          occupancyRate,
        },

        billOverview: {
          totalBills: bills.length,
          totalBillsAmount,
          paidBills,
          paidBillsAmount,
          unpaidBills,
          reservedBills,
          outstandingAmount,
          overdueBills,
          overdueAmount,
          collectedThisMonth,
        },

        maintenanceOverview: {
          totalComplaints,
          pendingComplaints,
          inProgressComplaints,
          resolvedComplaints,
          rejectedComplaints,
          openComplaints: pendingComplaints + inProgressComplaints,
        },

        properties,
        recentTenants,
        recentPayments,
        recentBills,
        recentComplaints,
      },
    });
  } catch (error) {
    console.error("Owner dashboard error:", error);

    return res.status(500).json({
      message: "Failed to fetch owner dashboard.",
    });
  }
};
