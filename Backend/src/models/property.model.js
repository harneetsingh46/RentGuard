import mongoose from "mongoose";    

const propertySchema = new mongoose.Schema({
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    },
    propertyName:{
        type:String,
        required:true,
        trim:true
    },
    address:{
        type:String,
        required:true,
        trim:true
    }
},{timestamps:true})

export const Property = mongoose.model("Property",propertySchema)