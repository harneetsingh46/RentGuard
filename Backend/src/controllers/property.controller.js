import { Property } from "../models/property.model.js";

// CREATE PROPERTY

export const createProperty = async (req, res, next) => {
  try {
    const { propertyName, address } = req.body;

    // Only owner can create property
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can create a property!",
      });
    }

    if (!propertyName || !address) {
      return res.status(400).json({
        message: "Property name and address are required!",
      });
    }

    // Check duplicate property for same owner
    const existingProperty = await Property.findOne({
      owner: req.user._id,
      address,
    });

    if (existingProperty) {
      return res.status(409).json({
        message: "Property already exists at this address!",
      });
    }

    const property = await Property.create({
      owner: req.user._id,
      propertyName,
      address,
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
    if (req.user.role !== "owner") {
      return res.status(403).json({
        message: "Only owner can access properties!",
      });
    }

    const {
      search,
      pages = 1,
      limit = 10,
      sort = "newest",
    } = req.query;

    const owner = req.user._id;

    const query = {
      owner,
    };

    // Search by property name or address
    if (search) {
      query.$or = [
        {
          propertyName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          address: {
            $regex: search,
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

    // Only owner can access
    if (req.user.role !== "owner") {
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
    const { propertyName, address } = req.body;
    const { id } = req.params;

    // Only owner can update
    if (req.user.role !== "owner") {
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
      property.propertyName = propertyName;
    }

    if (address !== undefined) {
      property.address = address;
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

    // Only owner can delete
    if (req.user.role !== "owner") {
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