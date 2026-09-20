import { Rent } from "../models/rent.model.js";

export const updateOverdueRents = async () => {
  try {
    const result = await Rent.updateMany(
      {
        dueDate: { $lt: new Date() },
        status: { $in: ["pending", "partial"] },
      },
      {
        $set: {
          status: "overdue",
        },
      },
    );

    return result;
  } catch (error) {
    console.error("Error updating overdue rents:", error.message);
  }
};
