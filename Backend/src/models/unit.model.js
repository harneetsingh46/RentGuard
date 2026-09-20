import mongoose from "mongoose";

const unitSchema = new mongoose.Schema({
    unitName:{
        type:String,
        required:true,
        trim:true
    },
    property:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Property",
        required:true
    },
    unitType:{
        type:String,
        enum:["residential","commercial"],
        required:true,
        lowercase:true
    },
    rent:{
        type:Number,
        required:true,
        default:0
    },
    status:{
        type:String,
        enum:["available","occupied","maintenance"],
        default:"available"
    }
},{timestamps:true})

export const Unit = mongoose.model("Unit",unitSchema)