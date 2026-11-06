import { User } from "../models/user.model.js";
import { Property } from "../models/property.model.js";
import { Tenant } from "../models/tenant.model.js";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Deletes owner accounts that were registered but never verified an OTP within
// 24 hours. Accounts that already own a property or have tenants are never deleted.
export const deleteUnverifiedOwners = async () => {
  const stale = await User.find({
    verifiedAt: null,
    createdAt: { $lt: new Date(Date.now() - DAY_MS) },
  }).select("_id");

  if (stale.length === 0) return 0;

  const ids = stale.map((user) => user._id);
  const [propertyOwners, tenantOwners] = await Promise.all([
    Property.distinct("owner", { owner: { $in: ids } }),
    Tenant.distinct("owner", { owner: { $in: ids } }),
  ]);

  const inUse = new Set([
    ...propertyOwners.map(String),
    ...tenantOwners.map(String),
  ]);
  const deletable = ids.filter((id) => !inUse.has(String(id)));

  if (deletable.length === 0) return 0;

  const result = await User.deleteMany({
    _id: { $in: deletable },
    verifiedAt: null,
  });

  return result.deletedCount;
};

export const startUnverifiedOwnerCleanup = () => {
  const run = () =>
    deleteUnverifiedOwners().catch((error) =>
      console.error("Unverified owner cleanup failed:", error.message),
    );

  run();

  return setInterval(run, HOUR_MS).unref();
};
