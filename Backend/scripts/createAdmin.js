
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Admin } from "../src/models/admin.model.js";

const createAdmin = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is missing from .env");
    }

    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(
        "Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env"
      );
    }

    if (ADMIN_PASSWORD.length < 6) {
      throw new Error("Admin password must be at least 6 characters.");
    }

    await mongoose.connect(process.env.MONGO_URL);

    const existingAdmin = await Admin.findOne({
      email: ADMIN_EMAIL.trim().toLowerCase(),
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await Admin.create({
      name: ADMIN_NAME.trim(),
      email: ADMIN_EMAIL.trim().toLowerCase(),
      passwordHash,
      role: "admin",
      isActive: true,
    });

    console.log("Admin registered successfully.");
  } catch (error) {
    console.error("Admin registration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
