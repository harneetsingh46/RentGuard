
import { createHmac, randomInt, timingSafeEqual } from "crypto";

import { User } from "../models/user.model.js";
import { Otp } from "../models/otp.model.js";
import genToken from "../utils/genToken.js";

import { OTP_CONFIG, OTP_CHANNEL } from "../config/policy.js";

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

// Normalize email or phone
const normalizeContact = (contact) => {
  return contact.trim().toLowerCase();
};

// Check whether contact is email or phone
const getContactType = (contact) => {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
  const isPhone = /^\d{10}$/.test(contact);

  if (isEmail) return "email";
  if (isPhone) return "phone";

  return null;
};

// Generate HMAC hash of OTP
const hashOtp = (otp) => {
  if (!process.env.OTP_SECRET_KEY) {
    throw new Error("OTP_SECRET_KEY is not configured");
  }

  return createHmac("sha256", process.env.OTP_SECRET_KEY)
    .update(otp)
    .digest("hex");
};

// Compare OTP hashes safely
const compareOtp = (enteredOtp, storedHash) => {
  const enteredHash = Buffer.from(hashOtp(enteredOtp), "hex");
  const savedHash = Buffer.from(storedHash, "hex");

  return (
    enteredHash.length === savedHash.length &&
    timingSafeEqual(enteredHash, savedHash)
  );
};

// Cookie settings
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
};

// Cookie clearing settings
const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

// --------------------------------------------------
// REGISTER OWNER
// --------------------------------------------------

export const register = async (req, res) => {
  try {
    const { username, email, phone } = req.body;

    // Validate required fields
    if (!username || !email || !phone) {
      return res.status(400).json({
        message: "Username, email and phone are required",
      });
    }

    // Validate data types
    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid registration details",
      });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // Username validation
    if (
      normalizedUsername.length < 3 ||
      normalizedUsername.length > 30
    ) {
      return res.status(400).json({
        message: "Username must be between 3 and 30 characters",
      });
    }

    // Email validation
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    // Phone validation
    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        message: "Phone number must contain 10 digits",
      });
    }

    // Check duplicate username, email or phone
    const existingUser = await User.findOne({
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username, email or phone already exists",
      });
    }

    // Create owner account
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      phone: normalizedPhone,
      role: "owner",
      isActive: true,
      tokenVersion: 0,
    });

    // Registration does not automatically log in
    return res.status(201).json({
      message: "Owner registered successfully. Please login using OTP.",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Username, email or phone already exists",
      });
    }

    console.error("Owner registration error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// --------------------------------------------------
// REQUEST OTP
// --------------------------------------------------

export const requestOtp = async (req, res) => {
  try {
    const { contact } = req.body;

    if (!contact || typeof contact !== "string") {
      return res.status(400).json({
        message: "Email or phone number is required",
      });
    }

    const normalizedContact = normalizeContact(contact);
    const contactType = getContactType(normalizedContact);

    if (!contactType) {
      return res.status(400).json({
        message: "Please enter a valid email or 10-digit phone number",
      });
    }

    // Find owner by email or phone
    const user = await User.findOne({
      [contactType]: normalizedContact,
    });

    // Same response for existing and non-existing accounts
    const responseMessage =
      "If an active owner account exists, an OTP will be sent.";

    if (!user || !user.isActive || user.role !== "owner") {
      return res.status(200).json({
        message: responseMessage,
      });
    }

    // Generate OTP using configured length
    const otpLength = OTP_CONFIG.LENGTH;

    const minOtp = 10 ** (otpLength - 1);
    const maxOtp = 10 ** otpLength;

    const otp = randomInt(minOtp, maxOtp).toString();

    // Hash OTP
    const hashedOtp = hashOtp(otp);

    // Calculate expiry
    const expiresAt = new Date(
      Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000
    );

    // Create or replace existing OTP
    try {
      await Otp.findOneAndUpdate(
        { contact: normalizedContact },
        {
          $set: {
            hash: hashedOtp,
            attempts: 0,
            expiresAt,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
    } catch (error) {
      // Handle concurrent requests creating the same contact
      if (error.code !== 11000) {
        throw error;
      }

      await Otp.updateOne(
        { contact: normalizedContact },
        {
          $set: {
            hash: hashedOtp,
            attempts: 0,
            expiresAt,
          },
        }
      );
    }

    // Development OTP delivery
    if (OTP_CHANNEL === "console") {
      console.log(`RentGuard OTP for ${normalizedContact}: ${otp}`);
    }

    return res.status(200).json({
      message: responseMessage,
    });
  } catch (error) {
    console.error("Request OTP error:", error);

    return res.status(500).json({
      message: "Unable to process OTP request",
    });
  }
};

// --------------------------------------------------
// VERIFY OTP AND LOGIN OWNER
// --------------------------------------------------

export const verifyOtp = async (req, res) => {
  try {
    const { contact, otp } = req.body;

    // Validate contact
    if (!contact || typeof contact !== "string") {
      return res.status(400).json({
        message: "Email or phone is required",
      });
    }

    // Validate OTP
    if (
      typeof otp !== "string" ||
      otp.length !== OTP_CONFIG.LENGTH ||
      !/^\d+$/.test(otp)
    ) {
      return res.status(400).json({
        message: `OTP must contain ${OTP_CONFIG.LENGTH} digits`,
      });
    }

    const normalizedContact = normalizeContact(contact);
    const contactType = getContactType(normalizedContact);

    if (!contactType) {
      return res.status(400).json({
        message: "Please enter a valid email or phone number",
      });
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({
      contact: normalizedContact,
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    const now = new Date();

    // Check expiry
    if (otpRecord.expiresAt <= now) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Check maximum attempts
    if (otpRecord.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        message: "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    // Calculate entered OTP hash
    const enteredHash = hashOtp(otp);

    const enteredHashBuffer = Buffer.from(enteredHash, "hex");
    const savedHashBuffer = Buffer.from(otpRecord.hash, "hex");

    const isOtpCorrect =
      enteredHashBuffer.length === savedHashBuffer.length &&
      timingSafeEqual(enteredHashBuffer, savedHashBuffer);

    // Handle incorrect OTP
    if (!isOtpCorrect) {
      // Increment attempts atomically
      const updateResult = await Otp.updateOne(
        {
          _id: otpRecord._id,
          hash: otpRecord.hash,
          attempts: { $lt: OTP_CONFIG.MAX_ATTEMPTS },
          expiresAt: { $gt: now },
        },
        {
          $inc: { attempts: 1 },
        }
      );

      // Record may have been consumed or replaced
      if (updateResult.modifiedCount === 0) {
        return res.status(400).json({
          message: "Invalid or expired OTP",
        });
      }

      const updatedOtp = await Otp.findById(otpRecord._id);

      // Delete OTP after maximum attempts
      if (
        !updatedOtp ||
        updatedOtp.attempts >= OTP_CONFIG.MAX_ATTEMPTS
      ) {
        await Otp.deleteOne({
          _id: otpRecord._id,
          attempts: { $gte: OTP_CONFIG.MAX_ATTEMPTS },
        });

        return res.status(400).json({
          message: "Too many incorrect attempts. Please request a new OTP.",
        });
      }

      return res.status(400).json({
        message: "Invalid OTP",
        remainingAttempts:
          OTP_CONFIG.MAX_ATTEMPTS - updatedOtp.attempts,
      });
    }

    // Find owner
    const user = await User.findOne({
      [contactType]: normalizedContact,
    });

    if (!user || !user.isActive || user.role !== "owner") {
      return res.status(401).json({
        message: "Unable to login. Please contact support.",
      });
    }

    // Atomically consume OTP.
    // Only one simultaneous request can successfully delete this record.
    const consumedOtp = await Otp.findOneAndDelete({
      _id: otpRecord._id,
      hash: otpRecord.hash,
      attempts: { $lt: OTP_CONFIG.MAX_ATTEMPTS },
      expiresAt: { $gt: new Date() },
    });

    if (!consumedOtp) {
      return res.status(400).json({
        message: "OTP is invalid, expired or already used.",
      });
    }

    // Set default token version if missing
    if (user.tokenVersion === undefined || user.tokenVersion === null) {
      user.tokenVersion = 0;
    }

    // Mark first successful OTP login
    if (!user.verifiedAt) {
      user.verifiedAt = new Date();
    }

    await user.save();

    // Generate JWT
    const token = genToken(user);

    return res
      .status(200)
      .cookie("token", token, cookieOptions)
      .json({
        message: "Login successful",
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return res.status(500).json({
      message: "OTP verification failed",
    });
  }
};

// --------------------------------------------------
// GET CURRENT OWNER
// --------------------------------------------------

export const getUser = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      message: "Owner details fetched successfully",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        verifiedAt: user.verifiedAt,
      },
    });
  } catch (error) {
    console.error("Get owner error:", error);

    return res.status(500).json({
      message: "Unable to fetch owner details",
    });
  }
};

// --------------------------------------------------
// LOGOUT CURRENT DEVICE
// --------------------------------------------------

export const logout = async (req, res) => {
  try {
    return res
      .clearCookie("token", clearCookieOptions)
      .status(200)
      .json({
        message: "Logout successful",
      });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      message: "Logout failed",
    });
  }
};

// --------------------------------------------------
// LOGOUT ALL DEVICES
// --------------------------------------------------

export const logoutAllDevices = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { tokenVersion: 1 },
    });

    return res
      .clearCookie("token", clearCookieOptions)
      .status(200)
      .json({
        message: "Logged out from all devices successfully",
      });
  } catch (error) {
    console.error("Logout all devices error:", error);

    return res.status(500).json({
      message: "Unable to logout from all devices",
    });
  }
};

// --------------------------------------------------
// UPDATE OWNER PROFILE
// --------------------------------------------------

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, email, phone } = req.body;

    const updates = {};

    // Username update
    if (username !== undefined) {
      if (typeof username !== "string" || !username.trim()) {
        return res.status(400).json({
          message: "Username cannot be empty",
        });
      }

      const normalizedUsername = username.trim().toLowerCase();

      if (
        normalizedUsername.length < 3 ||
        normalizedUsername.length > 30
      ) {
        return res.status(400).json({
          message: "Username must be between 3 and 30 characters",
        });
      }

      updates.username = normalizedUsername;
    }

    // Contact changes require a separate verification flow
    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          message: "Email cannot be empty",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
        return res.status(400).json({
          message: "Please enter a valid email address",
        });
      }

      if (normalizedEmail !== req.user.email) {
        return res.status(400).json({
          message: "Email changes require OTP verification. This feature is not available yet.",
        });
      }
    }

    if (phone !== undefined) {
      if (typeof phone !== "string" || !phone.trim()) {
        return res.status(400).json({
          message: "Phone number cannot be empty",
        });
      }

      const normalizedPhone = phone.trim();

      if (!/^\d{10}$/.test(normalizedPhone)) {
        return res.status(400).json({
          message: "Phone number must contain 10 digits",
        });
      }

      if (normalizedPhone !== req.user.phone) {
        return res.status(400).json({
          message: "Phone changes require OTP verification. This feature is not available yet.",
        });
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Please provide at least one field to update",
      });
    }

    // Check duplicate username
    if (updates.username) {
      const existingUser = await User.findOne({
        username: updates.username,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Username already exists",
        });
      }
    }

    // Update owner profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      data: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
};
