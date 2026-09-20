import { Property } from "../models/property.model.js";

export const createProperty = async (req, res, next) => {
  try {
    const user = req.user;
    const { propertyName, address } = req.body;
    if (!propertyName || !address) {
      return res.status(400).json({
        message: "All fields are required !",
      });
    }
    if (user.role !== "owner") {
      return res.status(400).json({
        message: "Unauthorized",
      });
    }
    const isPropertyExists = await Property.findOne({
      owner: req.user._id,
      address,
    });
    if (isPropertyExists) {
      return res.status(400).json({
        message: "Property Already Exists !",
      });
    }
    const property = await Property.create({
      owner: req.user._id,
      propertyName,
      address,
    });
    return res.status(200).json({
      message: "Property Successfully Registered !",
      data: property,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getProperty = async (req, res, next) => {
  try {
    const { search, pages = 1, limit = 10, sort = "newest" } = req.query;
    const owner = req.user._id;
    const query = {
      owner,
    };
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
    const skip = (pages - 1) * limit;
    let sortOption = { createdAt: -1 };

    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }
    if (sort === "name") {
      sortOption = { propertyName: 1 };
    }
    if (sort === "name-desc") {
      sortOption = { propertyName: -1 };
    }

    console.log(query, "query");

    const properties = await Property.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));
    const totalProperties = await Property.countDocuments(query);
    console.log(properties, "properties");

    if (properties.length === 0) {
      return res.status(404).json({ 
        message: "No properties found!" 
      });
    }
    return res.status(200).json({
      message: "Property(s) fetched succesfully!",
      data: properties,
      pagination: {
        total: totalProperties,
        pages: Number(pages),
        limit: Number(limit),
        totalPages: Math.ceil(totalProperties / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) {
      return res.status(400).json({
        message: "No Property Found !",
      });
    }
    return res.status(200).json({
      message: "Property fetched succesfully!",
      data: property,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateProperty = async (req, res, next) => {
  try {
    const { propertyName, address } = req.body;
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) {
      return res.status(400).json({
        message: "No Property Found !",
      });
    }
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to update this property!",
      });
    }
    if (propertyName) {
      property.propertyName = propertyName;
    }
    if (address) {
      property.address = address;
    }
    await property.save();
    return res.status(200).json({
      message: "Property Updated Succesfully !",
      data: property,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) {
      return res.status(400).json({
        message: "No Property Found !",
      });
    }
    console.log(property);
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to update this property!",
      });
    }
    await Property.findByIdAndDelete(id);
    res.status(200).json({
      message: "Property Deleted Succesfully !",
    });
    console.log(property);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
