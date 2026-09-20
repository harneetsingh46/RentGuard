import mongoose from "mongoose";    

const otpSchema = new mongoose.Schema({
    phone:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    expiresAt:{
        type:Date,
        required:true
    },
    attempts:{
        type:Number,
        default:0
    }
},{timestamps:true})

export const OTP = mongoose.model("OTP",otpSchema)