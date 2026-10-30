import { Category } from "../model/category.model.js";

export const createCategory = async (req, res, next) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({
        message: "Category is required",
      });
    }
    const data = await Category.create({
      category,
    });
    return res.status(201).json({
      message: "Category Created Successfully",
      data: {
        _id: data._id,
        categoryName: data.categoryName,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const data = await Category.find();
    if (data.length === 0) {
      return res.status(400).json({
        message: "Category not found !",
      });
    }
    return res.status(200).json({
      data,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};
