import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../utils/genToken.js";

export const register = async (req, res, next) => {
  try {
    const { username, email, password, phone, role, isActive } = req.body;
    if (!username || !email || !password || !phone || !role || !isActive) {
      return res.status(400).json({
        message: "All feilds are required !",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const isUserExists = await User.findOne({ email });
    if (isUserExists) {
      return res.status(400).json({
        message: "User Already Exists !",
      });
    }
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      phone,
      role,
      isActive,
    });
    return res.status(200).json({
      message: "User Register Succesfully!",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "All feilds are required",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is inactive",
      });
    }
    const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
      return res.status(400).json({
        message: "Invalid Password",
      });
    }
    const token = await genToken(user._id, user.username, user.email);
    return res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 100,
      })
      .json({
        message: "User login Successfull!",
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          token,
        },
      });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(400).json({
        message: "Something went wrong while fetching !",
      });
    }
    return res.status(200).json({
      message: "User Details",
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

export const logout = async (req,res,next)=>{
  try {
    res.clearCookie("token");
    return res.status(200).json({
      message: "User logout successfully!"
    })
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}