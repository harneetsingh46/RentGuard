import { Property } from "../models/property.model.js";
import { Unit } from "../models/unit.model.js";
import mongoose from "mongoose";
// CREATE PROPERTY

export const createProperty = async (req, res, next) => {
  try {
    const {
      propertyName,
      address,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
    } = req.body;

    // Only owner can create property
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owner can create a property!",
      });
    }

    if (!propertyName || !propertyName.trim()) {
      return res.status(400).json({
        message: "Property name is required!",
      });
    }

    const normalizedName = propertyName.trim();
    let composedAddress = "";
    let finalLine1 = "";
    let finalLine2 = "";
    let finalCity = "";
    let finalState = "";
    let finalPincode = "";

    // Legacy client support: only `address` sent without structured parts
    const isLegacy =
      !addressLine1 &&
      !city &&
      !state &&
      !pincode &&
      Boolean(address && address.trim());

    if (isLegacy) {
      composedAddress = address.trim();
      finalLine1 = address.trim();
    } else {
      if (!addressLine1 || !addressLine1.trim()) {
        return res.status(400).json({
          message: "Address line 1 is required!",
        });
      }
      if (!city || !city.trim()) {
        return res.status(400).json({
          message: "City is required!",
        });
      }
      if (!state || !state.trim()) {
        return res.status(400).json({
          message: "State is required!",
        });
      }
      if (!pincode || !String(pincode).trim()) {
        return res.status(400).json({
          message: "Pincode is required!",
        });
      }

      const trimmedPincode = String(pincode).trim();
      if (!/^[1-9]\d{5}$/.test(trimmedPincode)) {
        return res.status(400).json({
          message:
            "Invalid pincode. Pincode must be a 6-digit number not starting with 0.",
        });
      }

      finalLine1 = addressLine1.trim();
      finalLine2 = addressLine2 ? addressLine2.trim() : "";
      finalCity = city.trim();
      finalState = state.trim();
      finalPincode = trimmedPincode;

      const statePincode = `${finalState} ${finalPincode}`.trim();
      composedAddress = [finalLine1, finalLine2, finalCity, statePincode]
        .filter(Boolean)
        .join(", ");
    }

    const property = await Property.create({
      owner: req.user._id,
      propertyName: normalizedName,
      address: composedAddress,
      addressLine1: finalLine1,
      addressLine2: finalLine2,
      city: finalCity,
      state: finalState,
      pincode: finalPincode,
    });

    return res.status(201).json({
      message: "Property created successfully!",
      data: property,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET ALL PROPERTIES

export const getProperty = async (req, res, next) => {
  try {
    // Only owner can access properties
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owner can access properties!",
      });
    }

    const { search, pages = 1, limit = 10, sort = "newest" } = req.query;

    const owner = req.user._id;

    const query = {
      owner,
    };

    // Search by property name or address
    if (search) {
      const safeSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        {
          propertyName: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          address: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          addressLine1: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          city: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          pincode: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    const pageNumber = Math.max(Number(pages) || 1, 1);
    const limitNumber = Math.max(Number(limit) || 10, 1);

    const skip = (pageNumber - 1) * limitNumber;

    // Sorting
    let sortOption = {
      createdAt: -1,
    };

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1,
      };
    }

    if (sort === "name") {
      sortOption = {
        propertyName: 1,
      };
    }

    if (sort === "name-desc") {
      sortOption = {
        propertyName: -1,
      };
    }

    const properties = await Property.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    const totalProperties = await Property.countDocuments(query);

    if (properties.length === 0) {
      return res.status(404).json({
        message: "No properties found!",
      });
    }

    return res.status(200).json({
      message: "Properties fetched successfully!",
      data: properties,
      pagination: {
        total: totalProperties,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalProperties / limitNumber),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// GET ONE PROPERTY

export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid property ID!",
      });
    }

    // Only owner can access
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owner can access property details!",
      });
    }

    const property = await Property.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found!",
      });
    }

    return res.status(200).json({
      message: "Property fetched successfully!",
      data: property,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE PROPERTY

export const updateProperty = async (req, res, next) => {
  try {
    const {
      propertyName,
      address,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
    } = req.body;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid property ID!",
      });
    }

    // Only owner can update
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owner can update a property!",
      });
    }

    const property = await Property.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found!",
      });
    }

    // Update only provided fields
    if (propertyName !== undefined) {
      if (typeof propertyName === "string" && !propertyName.trim()) {
        return res.status(400).json({
          message: "Property name cannot be empty!",
        });
      }
      property.propertyName = propertyName.trim();
    }

    const hasStructuredParts =
      addressLine1 !== undefined ||
      addressLine2 !== undefined ||
      city !== undefined ||
      state !== undefined ||
      pincode !== undefined;

    if (hasStructuredParts) {
      if (
        pincode !== undefined &&
        pincode !== null &&
        String(pincode).trim() !== ""
      ) {
        const trimmedPincode = String(pincode).trim();
        if (!/^[1-9]\d{5}$/.test(trimmedPincode)) {
          return res.status(400).json({
            message:
              "Invalid pincode. Pincode must be a 6-digit number not starting with 0.",
          });
        }
      }

      const mergedLine1 =
        addressLine1 !== undefined
          ? addressLine1.trim()
          : property.addressLine1 || property.address || "";
      const mergedLine2 =
        addressLine2 !== undefined
          ? addressLine2.trim()
          : property.addressLine2 || "";
      const mergedCity =
        city !== undefined ? city.trim() : property.city || "";
      const mergedState =
        state !== undefined ? state.trim() : property.state || "";
      const mergedPincode =
        pincode !== undefined
          ? String(pincode).trim()
          : property.pincode || "";

      property.addressLine1 = mergedLine1;
      property.addressLine2 = mergedLine2;
      property.city = mergedCity;
      property.state = mergedState;
      property.pincode = mergedPincode;

      const statePincode = [mergedState, mergedPincode]
        .filter(Boolean)
        .join(" ")
        .trim();
      property.address = [mergedLine1, mergedLine2, mergedCity, statePincode]
        .filter(Boolean)
        .join(", ");
    } else if (address !== undefined) {
      // Legacy client sent single address string
      property.address = address.trim();
      if (!property.addressLine1) {
        property.addressLine1 = address.trim();
      }
    }

    await property.save();

    return res.status(200).json({
      message: "Property updated successfully!",
      data: property,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE PROPERTY

export const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid property ID!",
      });
    }

    // Only owner can delete
    if (req.authRole !== "owner") {
      return res.status(403).json({
        message: "Only owner can delete a property!",
      });
    }

    const property = await Property.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found!",
      });
    }

    const occupiedUnit = await Unit.findOne({
      property: id,
      status: { $in: ["Occupied", "occupied"] },
    });

    if (occupiedUnit) {
      return res.status(400).json({
        message: "Cannot delete property: one or more units are occupied.",
      });
    }

    await Property.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Property deleted successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
