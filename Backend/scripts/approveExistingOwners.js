
import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../src/models/user.model.js";

const approveExistingOwners = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is missing from Backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URL);

    // Use the raw MongoDB collection so Mongoose schema defaults
    // cannot turn missing statuses into "pending" during this migration.
    const result = await User.collection.updateMany(
      {
        role: "owner",
        verificationStatus: { $exists: false },
      },
      {
        $set: {
          verificationStatus: "approved",
          verificationReviewedAt: new Date(),
          verificationRejectionReason: null,
        },
      }
    );

    console.log(
      `Existing owners approved: ${result.modifiedCount}`
    );
  } catch (error) {
    console.error("Owner migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

approveExistingOwners();
