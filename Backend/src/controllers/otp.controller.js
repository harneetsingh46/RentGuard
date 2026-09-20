import { OTP } from "../models/otp.model.js";
import { User } from "../models/user.model.js";
import genToken from "../utils/genToken.js";

export const generateOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        message: "Phone Number is Required !",
      });
    }
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({
        message: "no user found , please register !",
      });
    }
    if (user.role !== "tenant") {
      return res.status(400).json({
        message: "You cannot login !",
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OTP.deleteMany({ phone });
    await OTP.create({
      phone,
      otp,
      expiresAt,
    });
    res.status(200).json({
      message: "OTP Generated SuccessFully !",
    });
    console.log(otp , "-OTP")
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({
        message: "Phone and OTP are required!",
      });
    }
    const otpRecord = await OTP.findOne({ phone });
    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid OTP!",
      });
    }
    if (otpRecord.expiresAt.getTime() < new Date()) {
      return res.status(400).json({
        message: "OTP has expired !",
      });
    }
    if (otp !== otpRecord.otp) {
      return res.status(400).json({
        message: "Invaild OTP !",
      });
    }
    const tenant = await User.findOne({ phone, role: "tenant"});
    const token = await genToken(tenant);
    return res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({
        message: "Tenant login Successfull!",
        data: {
          _id: tenant._id,
          role: tenant.role,
          token,
        },
      });
    await OTP.findOneAndDelete({ phone, otp });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
