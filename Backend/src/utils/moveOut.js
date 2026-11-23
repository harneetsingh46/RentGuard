import { Tenant } from "../models/tenant.model.js";
import { RentalRequest } from "../models/rentalRequest.model.js";

/**
 * Expires a pending move-out request if its 48-hour validity has elapsed,
 * and cancels any pending/approved rental applications for this tenant.
 *
 * @param {string|mongoose.Types.ObjectId} tenantId
 * @param {mongoose.ClientSession|null} [session=null]
 * @returns {Promise<Document|null>}
 */
export const expireStaleMoveOut = async (tenantId, session = null) => {
  if (!tenantId) return null;

  const now = new Date();
  const query = {
    _id: tenantId,
    "moveOutRequest.status": "pending",
    "moveOutRequest.expiresAt": { $lte: now },
  };

  const update = {
    $set: {
      "moveOutRequest.status": "expired",
      "moveOutRequest.reviewedAt": now,
    },
  };

  const options = { new: true };
  if (session) options.session = session;

  const tenant = await Tenant.findOneAndUpdate(query, update, options);

  if (tenant) {
    const rrQuery = {
      tenant: tenantId,
      status: { $in: ["Pending", "Approved"] },
    };
    const rrUpdate = {
      $set: {
        status: "Cancelled",
        rejectionReason: "Your move-out request expired.",
      },
    };

    if (session) {
      await RentalRequest.updateMany(rrQuery, rrUpdate, { session });
    } else {
      await RentalRequest.updateMany(rrQuery, rrUpdate);
    }
  }

  return tenant;
};
