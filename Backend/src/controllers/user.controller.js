import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../utils/genToken.js";

// REGISTER OWNER

export const register = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    if (!username || !email || !password || !phone) {
      return res.status(400).json({
        message: "Username, email, phone and password are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "owner",
      phone,
      isActive: true,
    });

    return res.status(201).json({
      message: "Owner registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone:user.phone
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// LOGIN OWNER OR TENANT

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required",
      });
    }

    const user = await User.findOne({
        email: email.toLowerCase().trim()  
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive",
      });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const token = genToken(
      user._id,
      user.username,
      user.email,
      user.role,
    );

    // Store JWT in HTTP-only cookie
    return res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({
        message: "Login successful",
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET CURRENT USER

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User details fetched successfully",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone:user.phone,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// LOGOUT

export const logout = async (req, res, next) => {
  try {
    return res
      .clearCookie("token")
      .status(200)
      .json({
        message: "Logout successful",
      });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE CURRENT USER PROFILE AND PASSWORD

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      username,
      email,
      phone,
      currentPassword,
      newPassword,
    } = req.body;

    const updates = {};

    // UPDATE USERNAME
    if (username !== undefined) {
      if (typeof username !== "string" || !username.trim()) {
        return res.status(400).json({
          message: "Username cannot be empty",
        });
      }

      const trimmedUsername = username.trim();

      if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
        return res.status(400).json({
          message: "Username must be between 3 and 30 characters",
        });
      }

      updates.username = trimmedUsername.toLowerCase();
    }

    // UPDATE EMAIL
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

      updates.email = normalizedEmail;
    }

    // UPDATE PHONE
    if (phone !== undefined) {
      if (typeof phone !== "string" || !phone.trim()) {
        return res.status(400).json({
          message: "Phone number cannot be empty",
        });
      }

      updates.phone = phone.trim();
    }

    // CHANGE PASSWORD
    if (currentPassword !== undefined || newPassword !== undefined) {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message: "Current password and new password are required",
        });
      }

      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return res.status(400).json({
          message: "New password must be at least 6 characters long",
        });
      }

      if (newPassword.length > 128) {
        return res.status(400).json({
          message: "New password cannot exceed 128 characters",
        });
      }

      // Fetch the user, including their hashed password
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Verify current password
      const isPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isPasswordCorrect) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      // Hash the new password before saving
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
    }

    // CHECK WHETHER THERE IS ANYTHING TO UPDATE
    if (Object.keys(updates).length === 0 &&
        currentPassword === undefined &&
        newPassword === undefined) {
      return res.status(400).json({
        message: "Please provide at least one field to update",
      });
    }

    // CHECK FOR DUPLICATE USERNAME OR EMAIL
    const duplicateConditions = [];

    if (updates.username) {
      duplicateConditions.push({ username: updates.username });
    }

    if (updates.email) {
      duplicateConditions.push({ email: updates.email });
    }

    if (duplicateConditions.length > 0) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: duplicateConditions,
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Username or email already exists",
        });
      }
    }

    // UPDATE PROFILE FIELDS
    let updatedUser;

    if (Object.keys(updates).length > 0) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");
    } else {
      updatedUser = await User.findById(userId).select("-password");
    }

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
        message: "Username or email already exists",
      });
    }

    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
};