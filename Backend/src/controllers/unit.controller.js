import { Unit } from "../models/unit.model.js";
import { Property } from "../models/property.model.js";

export const createUnit = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { unitName, unitType, rent, status } = req.body;
    if (!unitName || !unitType || !rent || !status) {
      return res.status(400).json({
        message: "Unit name, unit type , status and rent are required!",
      });
    }
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(400).json({
        message: "No Property Found!",
      });
    }
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to add a unit to this property!",
      });
    }
    const isUnitExists = await Unit.findOne({ property: propertyId, unitName });
    if (isUnitExists) {
      return res.status(400).json({
        message: "Unit Already Exists !",
      });
    }
    const unit = await Unit.create({
      unitName,
      unitType,
      property: propertyId,
      rent,
      status,
    });
    return res.status(200).json({
      message: "Unit Registered Successfully !",
      data: unit,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getUnits = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(400).json({
        message: "No units found!",
      });
    }
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to view these units!",
      });
    }
    const units = await Unit.find({
      property: propertyId,
    });
    if (!units) {
      return res.status(400).json({
        message: "No units found!",
      });
    }
    return res.status(200).json({
      message: "Units Fetched Successful !",
      units,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
export const getUnit = async (req, res, next) => {
  try {
    const { propertyId, unitId } = req.params;
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(400).json({
        message: "No Property found!",
      });
    }
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to view these units!",
      });
    }
    const unit = await Unit.findOne({ _id: unitId, property: propertyId });
    if (!unit) {
      return res.status(400).json({
        message: "No unit found!",
      });
    }
    return res.status(200).json({
      message: "Unit Fetched Successful !",
      unit,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateUnit = async (req, res, next) => {
  try {
    const { propertyId, unitId } = req.params;
    const { unitName, unitType, rent, status } = req.body;
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(400).json({
        message: "No Property Found",
      });
    }
    if(property.owner.toString() !== req.user._id.toString()){
        return res.status(403).json({
            message: "You are not authorized to view these units!"
        })
    }
    const unit = await Unit.findOne({_id:unitId,property:propertyId})
    if(!unit){
       return res.status(400).json({
        message: "No Unit Found",
      }); 
    }
    if(unitName !== undefined){
        unit.unitName = unitName
    }
    if(unitType !== undefined){
        unit.unitType = unitType
    }
    if(rent !== undefined){
        unit.rent = rent
    }
    if(status !== undefined){
        unit.status = status
    }
    await unit.save()
    return res.status(200).json({
        message: "Unit Updated Successfully !",
        data: unit
    })
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
export const deleteUnit = async (req, res, next) => {
  try {
    const { propertyId, unitId } = req.params;
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(400).json({
        message: "No Property Found",
      });
    }
    if(property.owner.toString() !== req.user._id.toString()){
        return res.status(403).json({
            message: "You are not authorized to view these units!"
        })
    }
    const unit = await Unit.findAndDelete({_id:unitId,property:propertyId})
    if(!unit){
       return res.status(400).json({
        message: "No Unit Found",
      }); 
    }
    return res.status(200).json({
        message: "Unit Deleted Successfully !",
        data: unit
    })
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
