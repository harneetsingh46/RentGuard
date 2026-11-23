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
    },
    addressLine1:{
        type:String,
        trim:true,
        default:""
    },
    addressLine2:{
        type:String,
        trim:true,
        default:""
    },
    city:{
        type:String,
        trim:true,
        default:""
    },
    state:{
        type:String,
        trim:true,
        default:""
    },
    pincode:{
        type:String,
        trim:true,
        default:""
    }
},{timestamps:true})

export const Property = mongoose.model("Property",propertySchema)