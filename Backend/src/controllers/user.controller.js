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