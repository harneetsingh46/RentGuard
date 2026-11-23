import "dotenv/config";
import mongoose from "mongoose";
import { Payment } from "../src/models/payment.model.js";

const fixPaymentIndexes = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is missing from Backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URL);

    const collection = Payment.collection;
    const indexes = await collection.indexes();
    const hasOldIndex = indexes.some((idx) => idx.name === "razorpayOrderId_1");

    if (hasOldIndex) {
      await collection.dropIndex("razorpayOrderId_1");
      console.log("Dropped old unique razorpayOrderId_1 index.");
    } else {
      console.log("Old razorpayOrderId_1 index not found or already dropped.");
    }

    await Payment.syncIndexes();
    console.log("Payment indexes synchronized successfully.");
  } catch (error) {
    console.error("Fix payment indexes failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

fixPaymentIndexes();
