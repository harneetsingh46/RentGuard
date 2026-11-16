
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Admin } from "../src/models/admin.model.js";

const seedAdmin = async () => {
  try {
    const { MONGO_URL, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } =
      process.env;

    if (!MONGO_URL || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(
        "MONGO_URL, ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required."
      );
    }

    if (ADMIN_PASSWORD.length < 6) {
      throw new Error("Admin password must be at least 12 characters.");
    }

    await mongoose.connect(MONGO_URL);

    const email = ADMIN_EMAIL.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      existingAdmin.name = ADMIN_NAME.trim();
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.isActive = true;
      existingAdmin.tokenVersion += 1;

      await existingAdmin.save();

      console.log("Admin account updated successfully.");
    } else {
      await Admin.create({
        name: ADMIN_NAME.trim(),
        email,
        passwordHash,
        role: "admin",
        isActive: true,
        tokenVersion: 0,
      });

      console.log("Admin account created successfully.");
    }
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();
